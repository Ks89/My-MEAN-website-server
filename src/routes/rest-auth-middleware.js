'use strict';

// ------------- imported from ./index.js ---------------

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger-winston');
const Utils = require('../utils/util');

module.exports.restAuthenticationMiddleware = function (req, res, next) {
  logger.warn('REST restAuthenticationMiddleware - req.session.authToken', req.session.authToken);

  // For testing purposes it could be useful to bypass this authentication middleware
  // to be able to modify the session.
  // There are some tests that are using this bypass to cover all statements and
  // branches.
  // ATTENTION - USE THIS FEATURE ONLY FOR TESTING PURPOSES!!!!!!!
  if (process.env.DISABLE_REST_AUTH_MIDDLEWARE === 'yes' && (process.env.NODE_ENV === 'test' || process.env.CI )) {
    // authentication middleware DISABLED
    // logger not required here
    console.warn('REST restAuthMiddleware disabled - because you are running this app with both ' +
      'DISABLE_REST_AUTH_MIDDLEWARE === yes and (process.env.NODE_ENV === test or process.env.CI === yes)');
    return next();
  }

  try {
    if (!req.session.authToken) {
      logger.error('REST restAuthenticationMiddleware - req.session.authToken not valid');
      return Utils.sendJSONres(res, 403, 'No token provided');
    }
    const authToken = JSON.parse(req.session.authToken);
    const token = authToken.token;
    logger.debug('REST restAuthenticationMiddleware - parsed token', token);
    if (!token) {
      logger.error('REST restAuthenticationMiddleware - Token not found');
      return Utils.sendJSONres(res, 404, 'Token not found');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.error('REST restAuthenticationMiddleware - jwt.verify error', err);
        return Utils.sendJSONres(res, 401, 'Jwt not valid or corrupted');
      }

      if (!decoded) {
        logger.error('REST restAuthenticationMiddleware - decoded is not valid (but before err was ok - WTF!!!)');
        return Utils.sendJSONres(res, 500, 'Impossible to check if jwt is valid - decoded is not valid');
      }

      logger.debug('REST restAuthenticationMiddleware - Token is valid', token);

      try {
        let isJwtValidDate = Utils.isJwtValidDate(decoded);
        logger.debug('REST restAuthenticationMiddleware - isJwtValidDate', isJwtValidDate);

        if (!isJwtValidDate) {
          logger.error('REST restAuthenticationMiddleware - jwt has an invalid data');
          return Utils.sendJSONres(res, 404, 'Data is not valid');
        }

        logger.debug('REST restAuthenticationMiddleware - systemDate valid');
        return next();

      } catch (err) {
        logger.error('REST restAuthenticationMiddleware - exception thrown by isJwtValidDate', err);
        return Utils.sendJSONres(res, 500, 'Impossible to check if jwt is valid');
      }
    });
  } catch (err) {
    logger.error('REST restAuthenticationMiddleware - exception catched', err);
    return Utils.sendJSONres(res, 403, 'No token provided');
  }
};
