'use strict';

const _ = require('lodash');
const config = require('../config');
let mongoose = require('mongoose');
let bcrypt = require('bcrypt-nodejs');
let jwt = require('jsonwebtoken');

//profileSchema with profile info not related to authentication
//These are info used only into the view
let profileSchema = new mongoose.Schema({
  name: String,
  surname: String,
  nickname: String,
  email: String,
  updated: Date,
  visible: {
    type: Boolean,
    required: true
  }
});

//REMEMBER that if you want to add other properties, you should check
//this function -> getFilteredUser in this file
let userSchema = new mongoose.Schema({
  local: {
    email: String,
    name: String,
    hash: String, //hash contains the password with also the salt generated with bcrypt
    activateAccountToken: String,
    activateAccountExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  //other type os users based on the login's type
  facebook: {
    id: String,
    token: String,
    email: String,
    name: String,
    profileUrl: String
  },
  twitter: {
    id: String,
    token: String,
    name: String,
    email: String,
    username: String
  },
  linkedin: {
    id: String,
    token: String,
    email: String,
    name: String
  },
  google: {
    id: String,
    token: String,
    email: String,
    name: String
  },
  github: {
    id: String,
    token: String,
    email: String,
    name: String,
    username: String,
    profileUrl: String
  },
  profile: profileSchema
});

userSchema.methods.setPassword = function (password) {
  if (!_.isString(password)) {
    throw 'not a valid password format';
  }

  //set password hashed with the salt integrated
  //like explained on stackoverflow:
  // The salt is incorporated into the hash (encoded in a base64-style format).
  this.local.hash = bcrypt.hashSync(password, bcrypt.genSaltSync(32), null);
};

userSchema.methods.validPassword = function (password) {
  if (!_.isString(password)) {
    throw 'not a valid password format';
  }
  return bcrypt.compareSync(password, this.local.hash);
};

//method to generete JWT
userSchema.methods.generateJwt = function () {
  return signJwt(false, this); // isForCookie = false (used elsewhere)
};

//method to generete JWT used to create a jwt cookie
//this is necessary to prevent
userSchema.methods.generateSessionJwtToken = function () {
  return signJwt(true, this); // isForCookie = true
};

function signJwt(isForCookie, thisObject) {
  let user;
  //console.log(thisObject);
  if (isForCookie === true) {
    //because I want to modify 'thisObject' without to change the mongoose object
    //FIXME find a better way to prevent json.parse and json.stringify
    user = getFilteredUserForCookie(JSON.parse(JSON.stringify(thisObject)));
  } else {
    user = getFilteredUser(thisObject);
  }

  let expiry = new Date();
  expiry.setTime(expiry.getTime() + 600000); //valid for 10 minutes (10*60*1000)

  return jwt.sign({
    _id: thisObject._id,
    //I don't want to expose private information here -> I filter
    //the user object into a similar object without some fields
    user: user,
    exp: parseFloat(expiry.getTime())
  }, config.JWT_SECRET);
}

function getFilteredUserForCookie(user) {
  const dbData = user;
  user.__v = undefined;
  filterUser(dbData, user);
  return user;
}

function getFilteredUser(user) {
  //use toObject to get data from mongoose object received as parameter
  const dbData = user.toObject();
  //clone the user - necessary
  let cloned = Object.create(user);
  cloned.__v = undefined;
  filterUser(dbData, cloned);
  return cloned;
}



function filterUser(dbData, user) {
  let blacklistProperties = [
    'profileUrl', 'token', 'username', 'activateAccountToken', 'activateAccountExpires',
    'resetPasswordToken', 'resetPasswordExpires', '_id', '__v', 'updated', 'hash'
  ];
  //because this is an utility function used everywhere,
  //I decided to use ...=undefined, instead of delete ... to achieve
  //better performances, as explained here:
  //http://stackoverflow.com/questions/208105/how-do-i-remove-a-property-from-a-javascript-object?rq=1
  for (let prop in dbData) {
    if (dbData.hasOwnProperty(prop) && prop !== '_id') {
      //console.log('2-obj.' + prop + ' = ' + dbData[prop]);
      for (let innerProp in dbData[prop]) {
        //console.log('3-obj.' + innerProp + ' = ' + dbData[prop][innerProp]);
        if (blacklistProperties.includes(innerProp)) {
          user[prop][innerProp] = undefined;
        }
      }
    }
  }
}

mongoose.model('User', userSchema);
