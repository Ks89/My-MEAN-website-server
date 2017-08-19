'use strict';

module.exports = {

  BASE_API_PATH                                                   : '/api',
  BASE_LOG_API_PATH                                               : '/api/log',

  POST_LOG_DEBUG                                                  : '/debug',
  POST_LOG_ERROR                                                  : '/error',
  POST_LOG_EXCEPTION                                              : '/exception',

  GET_PROJECTS                                                    : '/projects',
  GET_PROJECTHOME                                                 : '/projecthome',
  GET_PROJECT_BY_ID                                               : '/projects/:projectid',

  POST_CONTACT_EMAIL                                              : '/email',

  POST_LOCAL_REGISTER                                             : '/register',
  POST_LOCAL_LOGIN                                                : '/login',
  POST_LOCAL_RESET                                                : '/reset',
  POST_LOCAL_RESET_PWD_FROM_MAIL                                  : '/resetNewPassword',
  POST_LOCAL_ACTIVATE                                             : '/activateAccount',
  GET_LOCAL_ACTIVATE_EMAIL_URL                                    : '/activate',
  GET_UNLINK_LOCAL                                                : '/unlink/local',

  GET_3DAUTH_GITHUB                                               : '/auth/github',
  GET_3DAUTH_GITHUB_CB                                            : '/auth/github/callback',
  GET_3DAUTH_GOOGLE                                               : '/auth/google',
  GET_3DAUTH_GOOGLE_CB                                            : '/auth/google/callback',
  GET_3DAUTH_FACEBOOK                                             : '/auth/facebook',
  GET_3DAUTH_FACEBOOK_CB                                          : '/auth/facebook/callback',
  GET_3DAUTH_TWITTER                                              : '/auth/twitter',
  GET_3DAUTH_TWITTER_CB                                           : '/auth/twitter/callback',
  GET_3DAUTH_LINKEDIN                                             : '/auth/linkedin',
  GET_3DAUTH_LINKEDIN_CB                                          : '/auth/linkedin/callback',
  GET_CONNECT_GITHUB                                              : '/connect/github',
  GET_CONNECT_GITHUB_CB                                           : '/connect/github/callback',
  GET_CONNECT_GOOGLE                                              : '/connect/google',
  GET_CONNECT_GOOGLE_CB                                           : '/connect/google/callback',
  GET_CONNECT_FACEBOOK                                            : '/connect/facebook',
  GET_CONNECT_FACEBOOK_CB                                         : '/connect/facebook/callback',
  GET_CONNECT_TWITTER                                             : '/connect/twitter',
  GET_CONNECT_TWITTER_CB                                          : '/connect/twitter/callback',
  GET_CONNECT_LINKEDIN                                            : '/connect/linkedin',
  GET_CONNECT_LINKEDIN_CB                                         : '/connect/linkedin/callback',
  GET_UNLINK_FACEBOOK                                             : '/unlink/facebook',
  GET_UNLINK_GITHUB                                               : '/unlink/github',
  GET_UNLINK_GOOGLE                                               : '/unlink/google',
  GET_UNLINK_TWITTER                                              : '/unlink/twitter',
  GET_UNLINK_LINKEDIN                                             : '/unlink/linkedin',

  GET_USER_BY_ID                                                  : '/users/:id',

  POST_PROFILE                                                    : '/profile',

  GET_LOGOUT                                                      : '/logout',
  GET_SESSIONTOKEN                                                : '/sessionToken',
  GET_DECODETOKEN_BY_TOKEN                                        : '/decodeToken/:token',
  GET_UNLINK_GENERIC                                              : '/unlink',



  // ONLY FOR TESTING - NOT USED IN PRODUCTION
  GET_TESTING_DESTROY_SESSION                                     : '/testing/destroySession',
  GET_TESTING_STRING_SESSION                                      : '/testing/setStringSession',
  GET_TESTING_JSON_NO_TOKEN                                       : '/testing/setJsonWithoutTokenSession',
  GET_TESTING_JSON_WRONG_FORMAT_TOKEN                             : '/testing/setJsonWithWrongFormatTokenSession',
  GET_TESTING_JSON_EXPIRED                                        : '/testing/setJsonWithExpiredDateSession',
  GET_TESTING_USERS                                               : '/users',
  GET_DECODETOKEN                                                 : '/decodeToken'

};