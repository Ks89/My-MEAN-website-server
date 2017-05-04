'use strict';

let logger = require('../../../utils/logger-winston.js');
let LocalStrategy = require('passport-local').Strategy;
let passport = require('passport');

//used into the main app.js
module.exports = function (userRef) {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, (req, username, password, done) => {
    process.nextTick(() => {
      userRef.findOne({'local.email': username}, (err, user) => {
        if (err) {
          logger.error('REST local-passport init - db error, userRef not found', err);
          return done(err);
        }

        if (!user || !user.validPassword(password)) {
          logger.error('REST local-passport init - Incorrect username or password. Or this account is not activated, check your mailbox');
          return done(null, false, 'Incorrect username or password. Or this account is not activated, check your mailbox.');
        }

        return done(null, user);
      });
    });
  }));

  return module;
};