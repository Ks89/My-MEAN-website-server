'use strict';

const _ = require('lodash');
let Utils = require('../utils/util.js');
let logger = require('../utils/logger-winston');
let User = require('mongoose').model('User');

/**
 * @api {get} /api/users/:id get a user with the requested id.
 * @apiVersion 0.0.1
 * @apiName GetUserById
 * @apiGroup Users
 * @apiPermission authentication
 *
 * @apiDescription Get a user by its <code>id</code>.
 *
 * @apiSuccess {String} _id User <code>id</code>.
 * @apiSuccess {Object} [profile] User profile's Object.
 * @apiSuccess {String} profile._id Profile id.
 * @apiSuccess {String} profile.name Profile name.
 * @apiSuccess {String} profile.surname Profile surname.
 * @apiSuccess {String} profile.nickname Profile nickname.
 * @apiSuccess {String} profile.email Profile email.
 * @apiSuccess {Date} profile.updated Date of the latest update.
 * @apiSuccess {String} profile.visible Boolean to show/hide profile information.
 * @apiSuccess {Object} [google] User Google account Object.
 * @apiSuccess {String} google.id Google id obtained during oauth2 authentication.
 * @apiSuccess {String} google.name Google name obtained during oauth2 authentication.
 * @apiSuccess {String} google.email Google email obtained during oauth2 authentication.
 * @apiSuccess {String} google.token Google token obtained during oauth2 authentication.
 * @apiSuccess {Object} [linkedin] User Linkedin account Object.
 * @apiSuccess {String} linkedin.id Linkedin id obtained during oauth2 authentication.
 * @apiSuccess {String} linkedin.name Linkedin name obtained during oauth2 authentication.
 * @apiSuccess {String} linkedin.email Linkedin email obtained during oauth2 authentication.
 * @apiSuccess {String} linkedin.token Linkedin token obtained during oauth2 authentication.
 * @apiSuccess {Object} [github] User Github account Object.
 * @apiSuccess {String} github.id Github id obtained during oauth2 authentication.
 * @apiSuccess {String} github.name Github name obtained during oauth2 authentication.
 * @apiSuccess {String} github.email Github email obtained during oauth2 authentication.
 * @apiSuccess {String} github.username Github username obtained during oauth2 authentication.
 * @apiSuccess {String} github.profileUrl Github profileUrl obtained during oauth2 authentication.
 * @apiSuccess {String} github.token Github token obtained during oauth2 authentication.
 * @apiSuccess {Object} [facebook] User Facebook account Object.
 * @apiSuccess {String} facebook.id Facebook id obtained during oauth2 authentication.
 * @apiSuccess {String} facebook.name Facebook name obtained during oauth2 authentication.
 * @apiSuccess {String} facebook.email Facebook email obtained during oauth2 authentication.
 * @apiSuccess {String} facebook.profileUrl Facebook profileUrl obtained during oauth2 authentication.
 * @apiSuccess {String} facebook.token Facebook token obtained during oauth2 authentication.
 * @apiSuccess {Object} [twitter] User Twitter account Object.
 * @apiSuccess {String} twitter.id Twitter id obtained during oauth2 authentication.
 * @apiSuccess {String} twitter.name Twitter name obtained during oauth2 authentication.
 * @apiSuccess {String} twitter.email Twitter email obtained during oauth2 authentication.
 * @apiSuccess {String} twitter.username Twitter username obtained during oauth2 authentication.
 * @apiSuccess {String} twitter.token Twitter token obtained during oauth2 authentication.
 * @apiSuccess {Object} [local] User Local account Object.
 * @apiSuccess {String} local.name Local account name.
 * @apiSuccess {String} local.email Local account email.
 * @apiSuccess {String} local.hash Local account encrypted password.
 * @apiSuccess {String} [local.activateAccountToken] Activation token that will be removed after the account's activation.
 * @apiSuccess {Date} [local.activateAccountExpires] Activation expiration date, that will be removed after the account's activation (if date is valid).
 * @apiSuccess {String} [local.resetPasswordToken] Reset token that will be removed when user will choose a new password.
 * @apiSuccess {Date} [local.resetPasswordExpires] Reset expiration date, that will be removed when user will choose a new password (if date is valid).
 *
 * @apiError NoUserId 400 Text message 'No userid in request'.
 * @apiError UserNotFound 404 Text message 'User not found'.
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 404 NOT FOUND
 *   {
 *     "message": "User not found"
 *   }
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 400 BAD REQUEST
 *   {
 *     "message": "No userid in request"
 *   }
 */
module.exports.usersReadOneById = function (req, res) {
  logger.debug('REST users usersReadOneById - Finding a User', req.params);
  if (!req.params || !req.params.id) {
    logger.error('REST users usersReadOneById - No userid in request');
    return Utils.sendJSONres(res, 400, 'No userid in request');
  }

  logger.debug('REST users usersReadOneById - fetching user from db');
  User.findById(req.params.id).then(user => {
    let clonedUser = _.cloneDeep(user);
    clonedUser.__v = undefined;
    logger.debug('REST users usersReadOneById - User found', clonedUser);
    return Utils.sendJSONres(res, 200, clonedUser);
  }).catch(err => {
    logger.error('REST users usersReadOneById - User NOT found', err);
    return Utils.sendJSONres(res, 404, 'User not found');
  });
};
