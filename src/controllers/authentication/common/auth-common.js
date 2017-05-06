'use strict';

const _ = require('lodash');
let async = require('async');
let Utils = require('../../../utils/util');
let logger = require('../../../utils/logger-winston');
let User = require('mongoose').model('User');
let AuthUtils = require('../../../utils/auth-util');


/**
 * @api {get} /api/decodeToken/:token Get the decoded token from the input pathparam.
 * @apiVersion 0.0.1
 * @apiName DecodeToken
 * @apiGroup AuthCommon
 * @apiPermission authenticate
 *
 * @apiDescription Get the decoded token from <code>token</code>.
 *   It returns a stringified decoded jwt token.
 *
 * @apiSuccess {String} text A stringified decoded jwt token.
 *
 * @apiError JwtError 401 Text message 'Jwt not valid or corrupted'.
 * @apiError DateError 401 Text message 'Token Session expired (date).'.
 * @apiError JwtNotValidError 401 Text message 'Impossible to decode token.'.
 * @apiError TokenNotFoundError 404 Text message 'No token found'.
 * @apiError JwtUnknownError 500 Text message 'Impossible to check if jwt is valid'.
 *
 * @apiErrorExample {text} Error-Response:
 *   HTTP/1.1 404 NOT FOUND
 *   a stringified jwt decoded token
 */
let decodeToken = async function (req, res) {
  logger.debug('REST auth-common decodeToken - decoding token');

  if (!req.params || !req.params.token) {
    logger.error('REST auth-common decodeToken - No token found');
    return Utils.sendJSONres(res, 404, 'No token found');
  }

  const token = req.params.token;
  logger.debug(`REST auth-common decodeToken - token is ${token}`);

  // FIXME experimental impl with async await
  try {
    let result = await Utils.isJwtValid(token);
    logger.error('REST auth-common decodeToken - No token found', result);
    return Utils.sendJSONres(res, 200, JSON.stringify(result));
  } catch (err) {
    logger.error('REST auth-common decodeToken - isJwtValid thrown an error', err);
    return Utils.sendJSONres(res, err.status, err.message);
  }
  // Utils.isJwtValid(token)
  // .then(result => {
  //   console.log("IsJwtValid result: " + JSON.stringify(result));
  //   return Utils.sendJSONres(res, 200, JSON.stringify(result));
  // }, reason => {
  //   console.log("IsJwtValid error: " + reason);
  //   Utils.sendJSONres(res, reason.status, reason.message);
  // });
};


/**
 * @api {get} /api/logout Logout, removing session data stored in Redis.
 * @apiVersion 0.0.1
 * @apiName Logout
 * @apiGroup AuthCommon
 * @apiPermission authenticate
 *
 * @apiDescription Logout, removing session data stored in Redis.
 *
 * @apiSuccess {String} message Constant text 'Logout succeeded'.
 *
 * @apiError NoTokenError 404 Text message 'Authtoken not available as session data'.
 *
 * @apiParamExample {json} Request-Example (local service):
 * HTTP/1.1 200 OK
 *   {
 *     "message": "Logout succeeded"
 *   }
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 404 NOT FOUND
 *   {
 *     "message": "Authtoken not available as session data"
 *   }
 */
let logout = function (req, res) {
  logger.debug('REST auth-common logout - authtoken', req.session.authToken);

  if (!req.session.authToken) {
    logger.error(`REST auth-common logout - Authtoken not available as session data in Redis, for instance you aren't logged`);
    return Utils.sendJSONres(res, 404, 'Authtoken not available as session data');
  }

  req.session.destroy(() => {
    logger.debug('REST auth-common logout - Session data destroyed');
    return Utils.sendJSONres(res, 200, {message: 'Logout succeeded'});
  });
};

/**
 * @api {get} /api/logout Get sessionToken stored in Redis.
 * @apiVersion 0.0.1
 * @apiName GetSessionToken
 * @apiGroup AuthCommon
 * @apiPermission authenticate
 *
 * @apiDescription Get sessionToken stored in Redis.
 *
 * @apiSuccess {String} text A stringified jwt token. The stringified object contains a token field.
 *
 * @apiError NoTokenError 404 Text message 'Authtoken not available as session data'.
 *
 * @apiParamExample {text} Request-Example (local service):
 *  HTTP/1.1 200 OK
 *    "{\"token\":\"your.session.token\"}"
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 404 NOT FOUND
 *   {
 *     "message": "Authtoken not available as session data"
 *   }
 */
let sessionToken = function (req, res) {
  logger.debug('REST auth-common sessionToken - getting token from Redis session');

  if (!req.session.authToken) {
    logger.error(`REST auth-common sessionToken - Authtoken not available as session data in Redis, for instance you aren't logged`);
    return Utils.sendJSONres(res, 404, 'Authtoken not available as session data');
  }

  logger.debug(`REST auth-common sessionToken - data available, authToken`, req.session.authToken);
  return Utils.sendJSONres(res, 200, req.session.authToken);
};

let generateSessionJwtToken = function (user) {
  logger.debug(`REST auth-common generateSessionJwtToken - called with user`, user);

  if (!user || _.isString(user) || !_.isObject(user) || _.isArray(user) ||
    _.isBoolean(user) || _.isDate(user) || Utils.isNotAcceptableValue(user)) {
    logger.error('REST auth-common generateSessionJwtToken - User must be a valid object - throwing an error...', user);
    throw 'User must be a valid object';
  }

  //call a user's model method to generete a jwt signed token
  const token3dauth = user.generateSessionJwtToken();
  return JSON.stringify({
    token: token3dauth
  });
};

let unlinkServiceByName = function (req, serviceName, res) {
  logger.debug('REST auth-common unlinkServiceByName - called with authToken', req.session.authToken);

  if (!req.session.authToken) {
    //in theory, !req.session.authToken will be catched inside rest-auth-middleware
    //I added some checks only to prevent strange behaviours.
    logger.error('REST auth-common unlinkServiceByName - authToken not found');
    return Utils.sendJSONres(res, 401, `Session not valid, probably it's expired`);
  }

  const token = JSON.parse(req.session.authToken).token;
  logger.debug('REST auth-common unlinkServiceByName - parsed token', token);

  if (!token) {
    //as the previous one
    logger.error('REST auth-common unlinkServiceByName - token not available');
    return Utils.sendJSONres(res, 401, 'Token not found');
  }

  async.waterfall([
    done => {
      Utils.isJwtValid(token)
        .then(result => {
          logger.debug('REST auth-common unlinkServiceByName - IsJwtValid result', result);
          done(null, result);
        }, err => {
          logger.error('REST auth-common unlinkServiceByName - IsJwtValid error', err);
          Utils.sendJSONres(res, err.status, err.message);
        });
    },
    (decodedToken, done) => {
      User.findById(decodedToken.user._id, (err, user) => {
        if (err || !user) {
          logger.error('REST auth-common unlinkServiceByName - User not found - cannot unlink (usersReadOneById)', err);
          return Utils.sendJSONres(res, 404, 'User not found - cannot unlink');
        }
        logger.debug('REST auth-common unlinkServiceByName - User found (usersReadOneById)', user);
        done(err, user, decodedToken);
      });
    },
    (user, decodedToken, done) => {
      let lastUnlink = AuthUtils.checkIfLastUnlink(serviceName, user);
      logger.debug('REST auth-common unlinkServiceByName - Check if last unlink', lastUnlink);
      if (lastUnlink) {
        if (decodedToken) {
          req.session.destroy(() => {
            logger.debug('REST auth-common unlinkServiceByName - Last unlink, session data destroyed, so removing from db');
            user.remove(() => {
              logger.debug('REST auth-common unlinkServiceByName - user removed', user);
              done(null, user);
            });
          });
        }
      } else {
        logger.debug('REST auth-common unlinkServiceByName - Unlinking normal situation, without a remove....');
        user = AuthUtils.removeServiceFromUserDb(serviceName, user);
        user.save(err => {
          if (err) {
            logger.error('REST auth-common unlinkServiceByName - Impossible to remove userService from db', err);
            return Utils.sendJSONres(res, 500, 'Impossible to remove userService from db');
          }

          req.session.authToken = generateSessionJwtToken(user);
          logger.debug('REST auth-common unlinkServiceByName - Unlinking, regenerate session token after unlink');
          done(err, user);
        });
      }
    }], (err, user) => {
    if (err) {
      logger.error('REST auth-common unlinkServiceByName - Unknown error', err);
      Utils.sendJSONres(res, 500, 'Unknown error');
    } else {
      logger.debug('REST auth-common unlinkServiceByName - User unlinked correctly!');
      Utils.sendJSONres(res, 200, 'User unlinked correctly!');
    }
  });
};

module.exports = {
  decodeToken: decodeToken,
  logout: logout,
  sessionToken: sessionToken,
  generateSessionJwtToken: generateSessionJwtToken,
  unlinkServiceByName: unlinkServiceByName
};
