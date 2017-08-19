'use strict';

const config = require('../../../config');

module.exports = {
  facebook: {
    clientID: config.FACEBOOK_APP_ID,
    clientSecret: config.FACEBOOK_APP_SECRET,
    callbackURL: config.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified'],
    passReqToCallback: true
  },
  twitter: {
    consumerKey: config.TWITTER_CONSUMER_KEY,
    consumerSecret: config.TWITTER_CONSUMER_SECRET,
    callbackURL: config.TWITTER_CALLBACK_URL,
    userProfileURL: config.TWITTER_PROFILE_URL,
    passReqToCallback : true
  },
  google: {
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: config.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  github: {
    clientID: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET,
    callbackURL: config.GITHUB_CALLBACK_URL,
    passReqToCallback: true
  },
  linkedin: {
    clientID: config.LINKEDIN_CLIENT_ID,
    clientSecret: config.LINKEDIN_CLIENT_SECRET,
    callbackURL: config.LINKEDIN_CALLBACK_URL,
    profileFields: ['id', 'first-name', 'last-name', 'email-address'],
    passReqToCallback: true,
    state: true
  }
};
