'use strict';

module.exports = {
  setCI                         : () => {
    process.env.CI = 'yes';
  },
  setProd                       : () => {
    process.env.NODE_ENV = 'production';
  },
  setTest                       : () => {
    process.env.NODE_ENV = 'test';
  },

  isCI                          : () => !!process.env.CI,
  isProd                        : () => process.env.NODE_ENV === 'production',
  isTest                        : () => process.env.NODE_ENV === 'test',
  isDisableRestAuthMiddleware   : () => !!process.env.DISABLE_REST_AUTH_MIDDLEWARE,

  NODE_ENV                      : process.env.NODE_ENV,
  CI                            : process.env.CI,
  PORT                          : process.env.PORT,
  JWT_SECRET                    : process.env.JWT_SECRET,
  USER_EMAIL                    : process.env.USER_EMAIL,
  PASS_EMAIL                    : process.env.PASS_EMAIL,
  RECAPTCHA_SECRET              : process.env.RECAPTCHA_SECRET,
  MONGODB_URI                   : process.env.MONGODB_URI,

  // re-assign all process.env variables to be used in this app and defined with dotenv to constants
  // In this way I can see all variables defined with donenv and used in this app
  // In CI I can't use dotenv => I provide default values for all these constants
  FRONT_END_PATH                : process.env.FRONT_END_PATH         || '../My-MEAN-website-client/dist',
  LARGE_PAYLOAD_MESSAGE         : process.env.LARGE_PAYLOAD_MESSAGE  || 'stop it!',
  EXPRESS_SESSION_SECRET        : process.env.EXPRESS_SESSION_SECRET || 'keyboard cat',
  HELMET_HIDE_POWERED_BY        : process.env.HELMET_HIDE_POWERED_BY || 'f__k u idiot',
  HELMET_REFERRER_POLICY        : process.env.HELMET_REFERRER_POLICY || 'no-referrer',
  HELMET_HPKP_SHA256S_1         : process.env.HELMET_HPKP_SHA256S_1  || 'AbCdEf123=',
  HELMET_HPKP_SHA256S_2         : process.env.HELMET_HPKP_SHA256S_2  || 'ZyXwVu456=',
  HELMET_HPKP_REPORT_URI        : process.env.HELMET_HPKP_REPORT_URI || 'https://example.com/hpkp-report',
  REDIS_HOST                    : process.env.REDIS_HOST             || 'localhost',
  REDIS_PORT                    : process.env.REDIS_PORT             || 6379,
  REDIS_TTL                     : process.env.REDIS_TTL              || 260
};