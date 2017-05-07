'use strict';

const _ = require('lodash');
const config = require('../../../config');
let mongoose = require('mongoose');
let Utils = require('../../../utils/util');
let logger = require('../../../utils/logger-winston');

let serviceNames = require('../serviceNames');
let thirdpartyConfig = require('./3dpartyconfig');
let FacebookStrategy = require('passport-facebook').Strategy;
let GitHubStrategy = require('passport-github').Strategy;
let GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
let LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
let TwitterStrategy = require('passport-twitter').Strategy;

//----------experimental---
let authExperimentalFeatures = require('../common/auth-experimental-collapse-db.js');
//-------------------------

function updateUser(user, accessToken, profile, serviceName) {
  if (Utils.isNotSimpleCustomObjectOrDate(user)) {
    logger.error('REST 3dparty-passport updateUser - impossible to update because user must be an object', user);
    throw 'impossible to update because user must be an object';
  }

  if (Utils.isNotSimpleCustomObjectOrDate(profile)) {
    logger.error('REST 3dparty-passport updateUser - impossible to update because profile must be an object', profile);
    throw 'impossible to update because profile must be an objects';
  }

  if (!_.isString(serviceName) || !_.isString(accessToken)) {
    logger.error('REST 3dparty-passport updateUser - impossible to update because both serviceName and accessToken must be strings', serviceName, accessToken);
    throw 'impossible to update because both serviceName and accessToken must be strings';
  }

  const whitelistServices = _.without(serviceNames, 'local', 'profile');
  if (whitelistServices.indexOf(serviceName) === -1) {
    logger.error('REST 3dparty-passport updateUser - impossible to update because serviceName is not recognized', whitelistServices);
    throw 'impossible to update because serviceName is not recognized';
  }

  // warning: if you are not able to set a value in user[serviceName]
  // go to models/users.js and add the missing property there.
  // common
  user[serviceName].id = profile.id;
  user[serviceName].token = accessToken;
  // other cases
  switch (serviceName) {
    case 'facebook':
      user[serviceName].name = profile.name.givenName + ' ' + profile.name.familyName;
      user[serviceName].profileUrl = profile.profileUrl;
      user[serviceName].email = profile.emails[0].value; //get the first email
      break;
    case 'github':
      user[serviceName].name = profile.displayName;
      user[serviceName].username = profile.username;
      user[serviceName].profileUrl = profile.profileUrl;
      if (profile.emails && profile.emails[0] && profile.emails[0].value) {
        //github users can hide profile's email
        user[serviceName].email = profile.emails[0].value; //get the first email
      }
      break;
    case 'google':
      user[serviceName].name = profile.displayName;
      user[serviceName].email = profile.emails[0].value; //get the first email
      break;
    case 'linkedin':
      user[serviceName].name = profile.name.givenName + ' ' + profile.name.familyName;
      user[serviceName].email = profile.emails[0].value; //get the first email
      break;
    case 'twitter':
      user[serviceName].name = profile.displayName ? profile.displayName : profile.username;
      user[serviceName].username = profile.username;
      if (profile.emails && profile.emails[0] && profile.emails[0].value) {
        //twitter doesn't provide profile.email's field by default. You must
        //request the permission to twitter to ask email to users.
        //To be sure, I decided to check if email's field is available.
        user[serviceName].email = profile.emails[0].value; //get the first email
      }
      break;
  }
  return user;
}

// this function calls done() when finish
function collapseDb(user, serviceName, req, done) {
  authExperimentalFeatures.collapseDb(user, serviceName, req)
    .then(result => {
      logger.debug('REST 3dparty-passport collapseDb - collapseDb OK', result);
      return done(null, result);
    }, err => {
      logger.error('REST 3dparty-passport collapseDb - collapseDb error', err);
      return done(null, user);
    });
}

function authenticate(req, accessToken, refreshToken, profile, done, serviceName, userRef) {
  process.nextTick(() => {
    let sessionLocalUserId = req.session.localUserId;

    if (_.isArray(sessionLocalUserId) || _.isRegExp(sessionLocalUserId) || _.isFunction(sessionLocalUserId) ||
      _.isDate(sessionLocalUserId) || _.isBoolean(sessionLocalUserId) || _.isError(sessionLocalUserId) ||
      _.isNaN(sessionLocalUserId) || _.isNumber(sessionLocalUserId)) {
      logger.error('REST 3dparty-passport authenticate - sessionLocalUserId must be either a string, null, undefined or an ObjectId', sessionLocalUserId);
      return done('sessionLocalUserId must be either a string, null, undefined or an ObjectId');
    }

    //check if the user is already logged in using the LOCAL authentication
    if (!_.isNil(sessionLocalUserId) &&
      ( _.isString(sessionLocalUserId) ||
      sessionLocalUserId instanceof mongoose.Types.ObjectId)) {

      logger.debug('REST 3dparty-passport authenticate - sessionLocalUserId found, managing 3dauth + local');
      //the user is already logged in
      userRef.findOne({'_id': sessionLocalUserId}, (err, user) => {
        if (err) {
          logger.error('REST 3dparty-passport authenticate - db error, cannot find logged user', err);
          return done('Impossible to find a user with the specified sessionLocalUserId');
        }
        if (!user) {
          logger.error('REST 3dparty-passport authenticate - Impossible to find an user with sessionLocalUserId');
          return done('Impossible to find an user with sessionLocalUserId');
        }
        logger.debug('REST 3dparty-passport authenticate - user found, saving');

        let userUpdated;
        try {
          userUpdated = updateUser(user, accessToken, profile, serviceName);
        } catch (exception) {
          logger.error('REST 3dparty-passport authenticate - exception in updateUser', exception);
          return done(exception);
        }

        logger.debug('REST 3dparty-passport authenticate - updated localuser with 3dpartyauth');
        userUpdated.save(err => {
          if (err) {
            return done(err);
          }

          //----------------- experimental ---------------
          collapseDb(user, serviceName, req, done);
          //----------------------------------------------
        });
      });
    } else {
      logger.debug('REST 3dparty-passport authenticate - only 3dauth');
      if (!req.user) { //if the user is NOT already logged in
        logger.debug('REST 3dparty-passport authenticate - User not already logged in');
        const serviceNameId = serviceName + '.id';

        const query = {};
        query[serviceNameId] = profile.id;

        logger.debug('REST 3dparty-passport authenticate - findOne by query', JSON.stringify(query));

        userRef.findOne(query, (err, user) => {
          if (err) {
            logger.error('REST 3dparty-passport authenticate - db error, User.findOne', err);
            return done(err);
          }

          if (user) { // if the user is found, then log them in
            logger.debug(`REST 3dparty-passport authenticate - User aren't logged in, but I found an user on db`);
            // if there is already a user id but no token (user was linked at one point and then removed)
            // just add our token and profile informations
            if (!user[serviceName].token) {
              logger.debug('REST 3dparty-passport authenticate - Id is ok, but not token, updating user...');
              let userUpdated;
              try {
                userUpdated = updateUser(user, accessToken, profile, serviceName);
              } catch (exception) {
                logger.error('REST 3dparty-passport authenticate - exception in updateUser', exception);
                return done(exception);
              }

              userUpdated.save((err, userSaved) => {
                if (err) {
                  logger.error('REST 3dparty-passport authenticate - db error while saving userUpdated', err);
                  done(err);
                }
                logger.debug('REST 3dparty-passport authenticate - User updated and saved');
                return done(null, userSaved);
              });
            } else {
              logger.debug('REST 3dparty-passport authenticate - Token is valid. Returns the user without modifications');
              return done(null, user);
            }
          } else {
            //otherwise, if there is no user found with that id, create them
            logger.debug('REST 3dparty-passport authenticate - User not found with that id, creating a new one...');

            let newUser;
            try {
              newUser = updateUser(new userRef(), accessToken, profile, serviceName);
            } catch (exception) {
              logger.error('REST 3dparty-passport authenticate - exception in updateUser', exception);
              return done(exception);
            }
            logger.debug('REST 3dparty-passport authenticate - New user created', newUser);
            newUser.save(err => {
              if (err) {
                logger.error('REST 3dparty-passport authenticate - db error while saving newUser', err);
                throw err;
              }
              return done(null, newUser);
            });
          }
        });
      } else {
        // user already exists and is logged in, we have to link accounts
        // req.user pull the user out of the session
        // and finally update the user with the currecnt users credentials
        logger.debug(`REST 3dparty-passport authenticate - User already exists and I'm previously logged in`);
        let user = updateUser(req.user, accessToken, profile, serviceName);
        user.save((err, savedUser) => {
          if (err) {
            logger.error('REST 3dparty-passport authenticate - db error while saving user', err);
            throw err;
          }

          logger.debug('REST 3dparty-passport authenticate - Saving already existing user');

          //----------------- experimental ---------------
          collapseDb(savedUser, serviceName, req, done);
          //----------------------------------------------
        });
      }
    }
  });
}


function buildStrategy(serviceName, userRef) {
  logger.debug(`REST 3dparty-passport authenticate - service ${serviceName} env: ${config.NODE_ENV}`);
  switch (serviceName) {
    case 'facebook':
      return new FacebookStrategy(thirdpartyConfig[serviceName],
        (req, accessToken, refreshToken, profile, done) => {
          authenticate(req, accessToken, refreshToken, profile, done, serviceName, userRef);
        });
    case 'github':
      return new GitHubStrategy(thirdpartyConfig[serviceName],
        (req, accessToken, refreshToken, profile, done) => {
          authenticate(req, accessToken, refreshToken, profile, done, serviceName, userRef);
        });
    case 'google':
      return new GoogleStrategy(thirdpartyConfig[serviceName],
        (req, accessToken, refreshToken, profile, done) => {
          authenticate(req, accessToken, refreshToken, profile, done, serviceName, userRef);
        });
    case 'linkedin':
      return new LinkedInStrategy(thirdpartyConfig[serviceName],
        (req, accessToken, refreshToken, profile, done) => {
          authenticate(req, accessToken, refreshToken, profile, done, serviceName, userRef);
        });
    case 'twitter':
      return new TwitterStrategy(thirdpartyConfig[serviceName],
        (req, accessToken, refreshToken, profile, done) => {
          authenticate(req, accessToken, refreshToken, profile, done, serviceName, userRef);
        });
  }
}

module.exports = function (userRef, passportRef) {
  passportRef.use(buildStrategy('facebook', userRef));
  passportRef.use(buildStrategy('github', userRef));
  passportRef.use(buildStrategy('google', userRef));
  passportRef.use(buildStrategy('linkedin', userRef));
  passportRef.use(buildStrategy('twitter', userRef));

  return module;
};
