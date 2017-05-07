'use strict';

const config = require('../../../config');
let Utils = require('../../../utils/util.js');
let MailUtils = require('../../../utils/mail-util');
let logger = require('../../../utils/logger-winston.js');
let User = require('mongoose').model('User');

let passport = require('passport');
let authCommon = require('../common/auth-common.js');
let async = require('async');
let crypto = require('crypto');

let mailTransport = MailUtils.getMailTransport();

function emailMsg(to, subject, htmlMessage) {
  return {
    from: config.USER_EMAIL,
    to: to,
    subject: subject,
    html: htmlMessage,
    generateTextFromHtml: true
  };
}

//function passed to async.waterfall's arrays to send an email
function sendEmail(user, message, done) {
  mailTransport.sendMail(message, err => {
    done(err, user);
  });
}

//function passed to async.waterfall's arrays to create a random token
function createRandomToken(done) {
  crypto.randomBytes(64, (err, buf) => {
    if (err) {
      logger.error('REST auth-local createRandomToken - crypto.randomBytes');
      throw err;
    }
    const token = buf.toString('hex');
    done(err, token);
  });
}

/**
 * @api {post} /api/register Register a new local user.
 * @apiVersion 0.0.1
 * @apiName RegisterLocal
 * @apiGroup AuthLocal
 * @apiPermission none
 *
 * @apiDescription Register a new local user.
 *   It will send an email to <code>email</code> with further instructions to activate the account.
 *
 * @apiParam {String} name User name.
 * @apiParam {String} email User email.
 * @apiParam {String} password User password.
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
*       "Content-Type": "application/json",
*				"XSRF-TOKEN": "A VALID TOKEN"
*     }
 *
 * @apiSuccess {String} message Text 'User with email <code>email</code> registered.'.
 *
 * @apiError ParamsError 400 All fields required.
 * @apiError DbReadError 500 Unknown error while registering...
 * @apiError UserExistsError 404 User already exists. Try to login.
 *
 * @apiParamExample {json} Request-Example:
 *     {
*       "name": "fake",
*       "email": "fake@fake.it",
*       "password": "Qw12345678"
*     }
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
*     "message": "User with email fake@fake.it registered."
*   }
 */
module.exports.register = (req, res, next) => {
  logger.debug('REST auth-local register - registering new user');

  if (!req.body.name || !req.body.email || !req.body.password) {
    logger.error('REST auth-local register - Missing params', req.body);
    return Utils.sendJSONres(res, 400, 'All fields required');
  }

  async.waterfall([
    createRandomToken, //first function defined above
    (token, done) => {
      const encodedUserName = encodeURI(req.body.name);
      logger.debug('REST auth-local register - encodedUserName', encodedUserName);

      const link = `http://${req.headers.host}/activate?emailToken=${token}&userName=${encodedUserName}`;

      User.findOne({'local.email': req.body.email}, (err, user) => {
        if (err) {
          logger.error('REST auth-local register - db error while searching user', err);
          return Utils.sendJSONres(res, 500, 'Unknown error while registering...');
        }

        if (user) {
          logger.error('REST auth-local register - User already exists');
          return Utils.sendJSONres(res, 400, 'User already exists. Try to login.');
        }

        let newUser = new User();
        newUser.local.name = req.body.name;
        newUser.local.email = req.body.email;
        newUser.setPassword(req.body.password);
        newUser.local.activateAccountToken = token;
        newUser.local.activateAccountExpires = new Date(Date.now() + 24 * 3600 * 1000); // 1 hour

        newUser.save((err, savedUser) => {
          if (err) {
            logger.error('REST auth-local register - db error while saving the new user', err);
            throw err;
          }
          logger.debug('REST auth-local register - User registered', savedUser);

          //create message data
          const msgText = 'You are receiving this because you (or someone else) have requested an account for this website.\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            link + '\n\n' +
            'If you did not request this, please ignore this email.\n';
          const message = emailMsg(req.body.email, 'Welcome to stefanocappa.it', msgText);

          done(err, savedUser, message);
        });
      });
    },
    sendEmail //function defined below
  ], (err, user) => {
    if (err) {
      logger.error('REST auth-local register - Unknown error', err);
      return next(err);
    } else {
      logger.debug('REST auth-local register - User registered successfully', user);
      return Utils.sendJSONres(res, 200, {message: 'User with email ' + user.local.email + ' registered.'});
    }
  });
};

/**
 * @api {post} /api/login Login as local user.
 * @apiVersion 0.0.1
 * @apiName LocalLocal
 * @apiGroup AuthLocal
 * @apiPermission none
 *
 * @apiDescription Login as local user.
 *
 * @apiParam {String} email User email.
 * @apiParam {String} password User password.
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
*       "Content-Type": "application/json",
*				"XSRF-TOKEN": "A VALID TOKEN"
*     }
 *
 * @apiSuccess {String} token Text with the jwt token.
 *
 * @apiError ParamsError 400 All fields required.
 * @apiError NotAuthError 401 Incorrect username or password. Or this account is not activated, check your mailbox.
 * @apiError SessionError 500 Impossible to generateSessionJwtToken
 * @apiError UserNotEnabledError 401 Incorrect username or password. Or this account is not activated, check your mailbox.
 *
 * @apiParamExample {json} Request-Example:
 *     {
*       "email": "fake@fake.it",
*       "password": "Qw12345678"
*     }
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
*     "token":"JWT TOKEN"
*   }
 */
module.exports.login = (req, res) => {
  logger.debug('REST auth-local login - logging in');

  if (!req.body.email || !req.body.password) {
    logger.error('REST auth-local login - Missing params', req.body);
    return Utils.sendJSONres(res, 400, 'All fields required');
  }

  passport.authenticate('local', (err, user) => {
    if (!user || err) {
      logger.error('REST auth-local register - db error while searching user', err);
      return Utils.sendJSONres(res, 401, 'Incorrect username or password. Or this account is not activated, check your mailbox.');
    }

    logger.debug('REST auth-local login - User found', user);

    if (!user.local.activateAccountToken && !user.local.activateAccountExpires) {
      logger.debug('REST auth-local login - User account previously activated', user);
      const token = user.generateJwt();

      req.session.localUserId = user._id;

      try {
        req.session.authToken = authCommon.generateSessionJwtToken(user);
        logger.debug('REST auth-local login - Session token', req.session.authToken);
        return Utils.sendJSONres(res, 200, {token: token});
      } catch (err2) {
        logger.error('REST auth-local register - db error while searching user', err2);
        return Utils.sendJSONres(res, 500, 'Impossible to generateSessionJwtToken');
      }

    } else {
      logger.error('REST auth-local register - User account not activated');
      return Utils.sendJSONres(res, 401, 'Incorrect username or password. Or this account is not activated, check your mailbox.');
    }
  })(req, res);
};

/**
 * @api {get} /api/unlink/local Unlink the local account.
 * @apiVersion 0.0.1
 * @apiName UnlinkLocal
 * @apiGroup AuthLocal
 * @apiPermission authenticate
 *
 * @apiDescription Unlink the local account (actually logged in).
 *
 * @apiSuccess {String} Constant plain-text: "User unlinked correctly!"
 *
 * @apiError SessionError 401 Text message 'Session not valid, probably it's expired'.
 *
 * @apiSuccessExample {text} Success-Response:
 *   HTTP/1.1 200 OK
 *     "User unlinked correctly!"
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 401 NOT FOUND
 *   {
*     "message": "Session not valid, probably it's expired"
*   }
 */
module.exports.unlinkLocal = (req, res) => {
  logger.debug('REST auth-local unlinkLocal - calling authCommon.unlinkServiceByName');
  authCommon.unlinkServiceByName(req, 'local', res);
};

/**
 * @api {post} /api/reset Reset the local password.
 * @apiVersion 0.0.1
 * @apiName ResetLocal
 * @apiGroup AuthLocal
 * @apiPermission none
 *
 * @apiDescription Reset the local password.
 *
 * @apiParam {String} email User email.
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
*       "Content-Type": "application/json",
*				"XSRF-TOKEN": "A VALID TOKEN"
*     }
 *
 * @apiSuccess {String} message Text 'An e-mail has been sent to fake@fake.it with further instructions.'.
 *
 * @apiError ParamsError 400 Email field is required.
 * @apiError NotExistError 404 No account with that email address exists.
 *
 * @apiParamExample {json} Request-Example:
 *     {
*       "email": "fake@fake.it"
*     }
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
*     "message":"An e-mail has been sent to fake@fake.it with further instructions."
*   }
 */
module.exports.reset = (req, res, next) => {
  logger.debug('REST auth-local reset - reset called');

  if (!req.body.email) {
    logger.error('REST auth-local reset - Missing params', req.body);
    return Utils.sendJSONres(res, 400, 'Email fields is required.');
  }

  async.waterfall([
    createRandomToken,
    (token, done) => {
      const link = 'http://' + req.headers.host + '/reset?emailToken=' + token;
      User.findOne({'local.email': req.body.email}, (err, user) => {

        if (!user || err) {
          logger.error('REST auth-local reset - db error, user not found', err);
          return Utils.sendJSONres(res, 404, 'No account with that email address exists.');
        }

        user.local.resetPasswordToken = token;
        user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save((err, savedUser) => {
          //create email data
          const msgText = 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            link + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n';
          const message = emailMsg(req.body.email, 'Password reset for stefanocappa.it', msgText);
          done(err, savedUser, message);
        });
      });
    },
    sendEmail //function defined below
  ], (err, user) => {
    if (err) {
      logger.error('REST auth-local reset - Error during reset', err);
      return next(err);
    } else {
      logger.debug('REST auth-local reset - finished', user);
      Utils.sendJSONres(res, 200, {message: `An e-mail has been sent to ${user.local.email} with further instructions.`});
    }
  });
};

/**
 * @api {post} /api/resetNewPassword Change the local password.
 * @apiVersion 0.0.1
 * @apiName ResetPasswordLocal
 * @apiGroup AuthLocal
 * @apiPermission none
 *
 * @apiDescription Change the local password after the reset.
 *
 * @apiParam {String} newPassword New user password.
 * @apiParam {String} emailToken Token received by email after the reset.
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
*       "Content-Type": "application/json",
*				"XSRF-TOKEN": "A VALID TOKEN"
*     }
 *
 * @apiSuccess {String} message Text 'An e-mail has been sent to fake@fake.it with further instructions.'.
 *
 * @apiError ParamsError 400 Password and emailToken fields are required.
 * @apiError NotExistError 404 No account with that token exists.
 *
 * @apiParamExample {json} Request-Example:
 *     {
*       "newPassword": "Qw12345678",
*       "emailToken": "TOKEN RECEIVED BY EMAIL"
*     }
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
*     "message":"An e-mail has been sent to fake@fake.it with further instructions."
*   }
 */
module.exports.resetPasswordFromEmail = (req, res, next) => {
  logger.debug('REST auth-local resetPasswordFromEmail - resetPasswordFromEmail called');

  if (!req.body.newPassword || !req.body.emailToken) {
    logger.error('REST auth-local resetPasswordFromEmail - Missing params', req.body);
    return Utils.sendJSONres(res, 400, 'Password and emailToken fields are required.');
  }

  async.waterfall([
    done => {
      User.findOne({
        'local.resetPasswordToken': req.body.emailToken,
        'local.resetPasswordExpires': {$gt: Date.now()}
      }, (err, user) => {
        if (!user || err) {
          logger.error('REST auth-local resetPasswordFromEmail - db error, user not found', err);
          return Utils.sendJSONres(res, 404, 'No account with that token exists.');
        }
        logger.debug('REST auth-local resetPasswordFromEmail - reset password called for user', user);

        user.setPassword(req.body.newPassword);
        user.local.resetPasswordToken = undefined;
        user.local.resetPasswordExpires = undefined;

        user.save((err, savedUser) => {

          //create email data
          const msgText = 'This is a confirmation that the password for your account ' +
            user.local.email + ' has just been changed.\n';
          const message = emailMsg(savedUser.local.email, 'Password for stefanocappa.it updated', msgText);

          done(err, savedUser, message);
        });
      });
    },
    sendEmail //function defined below
  ], (err, user) => {
    if (err) {
      logger.error('REST auth-local resetPasswordFromEmail - Error during resetPasswordFromEmail', err);
      return next(err);
    } else {
      logger.debug('REST auth-local resetPasswordFromEmail - finished', user);
      Utils.sendJSONres(res, 200, {message: `An e-mail has been sent to ${user.local.email} with further instructions.`});
    }
  });
};

/**
 * @api {post} /api/activateAccount Activate the local account.
 * @apiVersion 0.0.1
 * @apiName ActivateLocal
 * @apiGroup AuthLocal
 * @apiPermission none
 *
 * @apiDescription Activate the local account, using the token received on user's mailbox.
 *
 * @apiParam {String} emailToken Token received by email after the registration.
 * @apiParam {String} username Local user name.
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
*       "Content-Type": "application/json",
*				"XSRF-TOKEN": "A VALID TOKEN"
*     }
 *
 * @apiSuccess {String} message Text 'An e-mail has been sent to fake@fake.it with further instructions.'.
 *
 * @apiError ParamsError 400 EmailToken and userName fields are required.
 * @apiError NotExistError 404 No account with that token exists.
 * @apiError LinkExpiredError 404 Link exprired! Your account is removed. Please, create another account, also with the same email address.
 *
 * @apiParamExample {json} Request-Example:
 *     {
*       "emailToken": "TOKEN RECEIVED BY EMAIL"
*       "username": "Username",
*     }
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
*     "message":"An e-mail has been sent to fake@fake.it with further instructions."
*   }
 */
module.exports.activateAccount = (req, res, next) => {
  logger.debug('REST auth-local activateAccount - activateAccount called');

  if (!req.body.emailToken || !req.body.userName) {
    logger.error('REST auth-local activateAccount - Missing params', req.body);
    return Utils.sendJSONres(res, 400, "EmailToken and userName fields are required.");
  }

  const decodedUserName = decodeURI(req.body.userName);
  logger.debug('REST auth-local activateAccount - decoded userName', decodedUserName);

  async.waterfall([
    done => {
      User.findOne({'local.activateAccountToken': req.body.emailToken, 'local.name': decodedUserName},
        /*,'local.activateAccountExpires': { $gt: Date.now() }},*/ (err, user) => {
          if (!user || err) {
            logger.error('REST auth-local activateAccount - db error, user not found', err);
            return Utils.sendJSONres(res, 404, 'No account with that token exists.');
          }

          logger.debug('REST auth-local activateAccount - user.activateAccountExpires', user.local.activateAccountExpires);

          if (user.local.activateAccountExpires < new Date(Date.now())) {
            logger.error('REST auth-local activateAccount - Activation link expired', user.local.activateAccountExpires, new Date(Date.now()));
            return Utils.sendJSONres(res, 404, 'Link exprired! Your account is removed. Please, create another account, also with the same email address.');
          }

          logger.debug('REST auth-local activateAccount - activate account with user', user);

          user.local.activateAccountToken = undefined;
          user.local.activateAccountExpires = undefined;

          user.save((err, savedUser) => {
            logger.debug('REST auth-local activateAccount - activate account with savedUser', savedUser);

            //create email data
            const msgText = 'This is a confirmation that your account ' + user.local.name +
              'with email ' + user.local.email + ' has just been activated.\n';
            const message = emailMsg(savedUser.local.email, 'Account activated for stefanocappa.it', msgText);

            done(err, savedUser, message);
          });
        });
    },
    sendEmail //function defined below
  ], (err, user) => {
    if (err) {
      logger.error('REST auth-local activateAccount - Missing params', req.body);
      return next(err);
    } else {
      logger.debug('REST auth-local activateAccount - finished', user);
      Utils.sendJSONres(res, 200, {message: `An e-mail has been sent to ${user.local.email} with further instructions.`});
    }
  });
};
