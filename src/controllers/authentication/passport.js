// eslint-disable-line global-require
'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');
var logger = require('../../utils/logger.js');

//used into the main app.js
module.exports = function (passportRef) {
  //set this to serialize and deserialize informations like the user
  passportRef.serializeUser((user, done) => {
    logger.silly("Serializing user " + user);
    done(null, user.id);
  });

  passportRef.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      logger.silly("Deserializing user " + user);
      done(err, user);
    });
  });

  //-------------------------set the strategies----------------------
  //local
  require('./local/local-passport')(User, passportRef);

  //third parties, like fb, github, google, linkedin, twitter and so on
  require('./3dparty/3dparty-passport')(User, passportRef);

  return module;
};
