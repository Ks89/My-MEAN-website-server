'use strict';

let Utils = require('../utils/util.js');
let logger = require('../utils/logger-winston');
let User = require('mongoose').model('User');
let authCommon = require('./authentication/common/auth-common.js');

/**
* @api {post} /api/profile Update the user's profile.
* @apiVersion 0.0.1
* @apiName PostProfile
* @apiGroup Profile
* @apiPermission authentication
*
* @apiDescription Update the user's profile data.
* The email field is an additional profile information and not the value used to login.
*
* @apiParam {String} [localUserEmail] Email address used to register the local account. It's required if serviceName == 'local'.
* @apiParam {String} [id] User id, required only if serviceName != 'local'.
* @apiParam {String} serviceName One of these values [local,facebook,github,google,linkedin,twitter].
* @apiParam {String} name Profile name (required).
* @apiParam {String} surname Profile surname (required).
* @apiParam {String} nickname Profile nickname (required).
* @apiParam {String} email Profile email address (required).
*
* @apiHeaderExample {json} Header-Example:
*     {
*       "Content-Type": "application/json",
*				"XSRF-TOKEN": "A VALID TOKEN"
*     }
*
* @apiSuccess {String} message Constant that contains 'Profile updated successfully!'.
*
* @apiError ServiceNameError 400 <code>serviceName</code> is required.
* @apiError LocalUserEmailError 400 <code>LocalUserEmail</code> is required if you pass serviceName = local.
* @apiError IdError 400 <code>id</code> is required if you pass serviceName != local. It's the id obtained from the 3dparty service.
* @apiError ParamsError 400 All profile params are mandatory.
* @apiError DbReadError 401 Cannot update your profile. Please try to logout and login again.
* @apiError DbSaveError 404 Error while updating your profile. Please retry.
* @apiError AuthError 500 Impossible to generateSessionJwtToken
*
* @apiParamExample {json} Request-Example (local service):
*     {
*       "localUserEmail": "user@registration.com",
*       "id": "",
*       "serviceName": "local",
*       "name": "profile name",
*       "surname": "profile surname",
*       "nickname": "profile nickname",
*       "email": "profile email"
*     }
*
* @apiParamExample {json} Request-Example (thirdparty service):
*     {
*       "localUserEmail": "",
*       "id": "105151560202467598897",
*       "serviceName": "google",
*       "name": "profile name",
*       "surname": "profile surname",
*       "nickname": "profile nickname",
*       "email": "profile email"
*     }
*
* @apiSuccessExample {json} Success-Response:
*   HTTP/1.1 200 OK
*   {
*     "message": "Profile updated successfully!"
*   }
*/
module.exports.update = function(req, res) {
  logger.debug('REST profile update - updating profile', req.body);
  if(!req.body.serviceName) {
    logger.error('REST profile update - serviceName is required');
    Utils.sendJSONres(res, 400, 'serviceName is required');
    return;
  }
  if(req.body.serviceName === 'local' && !req.body.localUserEmail) {
    logger.error('REST profile update - localUserEmail is required if you pass serviceName = local');
    Utils.sendJSONres(res, 400, 'localUserEmail is required if you pass serviceName = local');
    return;
  }
  if(req.body.serviceName !== 'local' && !req.body.id) {
    logger.error('REST profile update - id is required if you pass serviceName != local');
    Utils.sendJSONres(res, 400, 'id is required if you pass serviceName != local');
    return;
  }

  if((req.body.name === null || req.body.name === undefined) ||
		(req.body.surname === null || req.body.surname === undefined) ||
		(req.body.nickname === null || req.body.nickname === undefined) ||
		(req.body.email === null || req.body.email === undefined)) {
    logger.error('REST profile update - All profile params are mandatory');
    Utils.sendJSONres(res, 400, 'All profile params are mandatory');
    return;
  }

  var query = {};

  if(req.body.serviceName !== 'local') {
    //third party authentication
    query[req.body.serviceName + '.id'] = req.body.id;
  } else {
    //local authentication
    query[req.body.serviceName + '.email'] = req.body.localUserEmail;
  }
  logger.debug('REST profile update - query', query);

  const profileObj = {
      name : req.body.name,
      surname : req.body.surname,
      nickname : req.body.nickname,
      email : req.body.email,
      updated : new Date(),
      visible : true
    };

  User.findOne(query, (err, user) => {
    if (!user || err) {
      logger.error('REST profile update - Unknown db error (either user or err variables)', err);
      Utils.sendJSONres(res, 401, 'Cannot update your profile. Please try to logout and login again.');
      return;
    }

    logger.debug(`REST profile update - User's profile to update is`, user);

    user.profile = profileObj; //update profile
    user.save((err, savedUser) => {
      if (err) {
        logger.error('REST profile update - Error while saving on db', err);
        Utils.sendJSONres(res, 404, 'Error while updating your profile. Please retry.');
      } else {
        logger.error('REST profile update - updating auth token with new profile info');
        try {
          req.session.authToken = authCommon.generateSessionJwtToken(savedUser);
          logger.debug('REST profile update - updated', savedUser);
          Utils.sendJSONres(res, 200, {message: 'Profile updated successfully!'});
        } catch(err2) {
          logger.error('REST profile update - Impossible to generateSessionJwtToken', err2);
          Utils.sendJSONres(res, 500, 'Impossible to generateSessionJwtToken');
        }
      }
    });
  });
};
