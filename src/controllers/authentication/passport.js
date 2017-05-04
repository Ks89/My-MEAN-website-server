'use strict';

let User = require('mongoose').model('User');
let logger = require('../../utils/logger-winston.js');

//used into the main app.js
module.exports = function (passportRef) {
  //set this to serialize and deserialize information like the user
  passportRef.serializeUser((user, done) => {
    logger.silly(`Serializing user ${user}`);
    done(null, user.id);
  });

  passportRef.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      logger.silly(`Deserializing user ${user}`);
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
