'use strict';

const config = require('../config');
let Utils = require('../utils/util.js');
let MailUtils = require('../utils/mail-util');
let logger = require('../utils/logger-winston');

let request = require('request');
let async = require('async');
let mailTransport = MailUtils.getMailTransport();

const RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * @api {post} /api/email Send an email to the administrator.
 * @apiVersion 0.0.1
 * @apiName PostContact
 * @apiGroup Contact
 * @apiPermission none
 *
 * @apiDescription Send an email to the administrator with a text message.
 *
 * @apiParam {String} response Text with the response received by Google Recaptcha2.
 * @apiParam {Object} emailFormData Object with email, object and message texts.
 * @apiParam {String} emailFormData.email Text with the sender email.
 * @apiParam {String} emailFormData.messageText Text message.
 * @apiParam {String} emailFormData.object Text with the email subject (title).
 *
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "Content-Type": "application/json",
 *				"XSRF-TOKEN": "A VALID TOKEN"
 *     }
 *
 * @apiSuccess {String} message Text that contains the same emailMessage passed into the request's body.
 *
 * @apiError RecaptchaError 401 Unknown recaptcha error. It returns recaptcha's response.
 * @apiError RecaptchaVerifyError 401 Recaptcha error while verifying. It returns 'Recaptcha verify answered FALSE!'.
 * @apiError MissingParamsError 400 It returns 'Missing input params'.
 * @apiError EmailSendError 404 It returns null (the value null, not a text).
 * @apiError ImpossibleSendError 500 It returns 'Impossibile to send the email'.
 * @apiError UnknownError 500 It returns 'Unknown error'.
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "response": "fsdfsdfsdfsd-response-dasdfasdas",
 *       "emailFormData": {
 *         "email": "email@emai.it",
 *         "messageText": "email message",
 *         "object": "email title"
 *       }
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "message": "email@emai.it"
 *   }
 */
module.exports.sendEmailWithRecaptcha = function (req, res) {
  logger.debug('REST contact sendEmailWithRecaptcha - Sending an email', req.body.response);

  //complete the request with my secret key
  //as described in google documentation.
  // DON'T LOG THIS!!!!!
  const data = {
    secret: process.env.RECAPTCHA_SECRET,
    response: req.body.response
    //here I can add also the IP, but it's not mandatory
  };

  async.waterfall([
    done => {
      request.post({url: RECAPTCHA_URL, form: data}, (err, response, body) => {
        logger.silly('REST contact sendEmailWithRecaptcha - RECAPTCHA_URL response', body);
        done(err, body);
      });
    },
    (body, done) => {
      let result = JSON.parse(body);
      logger.debug('REST contact sendEmailWithRecaptcha - RECAPTCHA_URL response parsed', result);
      if (result.success === false) {
        if (result['error-codes']) {
          logger.error('REST contact sendEmailWithRecaptcha - Error', result['error-codes']);
          Utils.sendJSONres(res, 401, result['error-codes']);
        } else {
          logger.error('REST contact sendEmailWithRecaptcha - Recaptcha verify answered FALSE!', result);
          Utils.sendJSONres(res, 401, 'Recaptcha verify answered FALSE!');
        }
      } else {
        done();
      }
    },
    (done) => {
      logger.debug('REST contact sendEmailWithRecaptcha - Trying to send an email');
      if (req.body.emailFormData && req.body.emailFormData.email &&
        req.body.emailFormData.object && req.body.emailFormData.messageText) {

        logger.debug('REST contact sendEmailWithRecaptcha - Preparing to send an email', req.body.emailFormData);
        done(null, req.body.emailFormData);
      } else {
        logger.error('REST contact sendEmailWithRecaptcha - Missing input params', req.body);
        Utils.sendJSONres(res, 400, 'Missing input params');
      }
    },
    (formEmail, done) => {
      logger.debug(`REST contact sendEmailWithRecaptcha - Sending an email from ${process.env.USER_EMAIL} to ${formEmail.email}`);
      const message = {
        from: process.env.USER_EMAIL,
        to: formEmail.email,
        subject: formEmail.object,
        html: formEmail.messageText,
        generateTextFromHtml: true
      };
      mailTransport.sendMail(message, err => {
        if (err) {
          logger.error('REST contact sendEmailWithRecaptcha - Error while sending an email', err.message);
          done(err, 404, null);
        }
        logger.debug('REST contact sendEmailWithRecaptcha - Mail sent', formEmail);
        done(null, 200, formEmail);
      });
    },
    (resultHttpCode, formEmail) => {
      logger.debug('REST contact sendEmailWithRecaptcha - resultHttpCode', resultHttpCode);
      if (resultHttpCode === 200) {
        logger.debug(`REST contact sendEmailWithRecaptcha - Message sent successfully to ${formEmail.email}`);
        Utils.sendJSONres(res, 200, {message: formEmail.email});
      } else {
        logger.error(`REST contact sendEmailWithRecaptcha - State != 200 while sending: ${resultHttpCode}`);
        Utils.sendJSONres(res, 500, 'Impossibile to send the email');
      }
    }], (err) => {
    if (err) {
      logger.error('REST contact sendEmailWithRecaptcha - Unknown error');
      Utils.sendJSONres(res, 500, 'Unknown error');
    }
  });
};
