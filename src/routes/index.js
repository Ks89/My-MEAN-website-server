'use strict';

const config = require('../config');

const APIS = require('./apis');

const ctrlProjects = require('../controllers/projects');
const ctrlContact = require('../controllers/contact');
const restAuthMiddleware = require('./rest-auth-middleware');
const ctrlUser = require('../controllers/users');
const ctrlProfile = require('../controllers/profile');
const ctrlAuthLocal = require('../controllers/authentication/local/auth-local');
const ctrlAuth3dParty = require('../controllers/authentication/3dparty/auth-3dparty');
const ctrlAuthCommon = require('../controllers/authentication/common/auth-common');

module.exports = function (express) {
	let router = express.Router();
	// if is test or ci, modify and returns `router` with test rest apis,
	//	otherwise return the same `router`
	router = isTestOrCi() ? require('./testing-api')(router) : router;

	// projects
	router.get(APIS.GET_PROJECTS, ctrlProjects.projectsList);
	router.get(APIS.GET_PROJECTHOME, ctrlProjects.projectsListHomepage);
	router.get(APIS.GET_PROJECT_BY_ID, ctrlProjects.projectsReadOne);
	//contacts
	router.post(APIS.POST_CONTACT_EMAIL, ctrlContact.sendEmailWithRecaptcha);

	//-----------------------------------------------------------------------------------------
	//-----------------------------------authentication----------------------------------------
	//-----------------------------------------------------------------------------------------
	//local
	router.post(APIS.POST_LOCAL_REGISTER, ctrlAuthLocal.register);
	router.post(APIS.POST_LOCAL_LOGIN, ctrlAuthLocal.login);
	router.post(APIS.POST_LOCAL_RESET, ctrlAuthLocal.reset);
	router.post(APIS.POST_LOCAL_RESET_PWD_FROM_MAIL, ctrlAuthLocal.resetPasswordFromEmail);
	router.post(APIS.POST_LOCAL_ACTIVATE, ctrlAuthLocal.activateAccount);
	//3dparty - first login
	router.get(APIS.GET_3DAUTH_GITHUB, ctrlAuth3dParty.authGithub);
	router.get(APIS.GET_3DAUTH_GITHUB_CB, ctrlAuth3dParty.authGithubCallback, ctrlAuth3dParty.callbackRedirectGithub);
	router.get(APIS.GET_3DAUTH_GOOGLE, ctrlAuth3dParty.authGoogle);
	router.get(APIS.GET_3DAUTH_GOOGLE_CB, ctrlAuth3dParty.authGoogleCallback, ctrlAuth3dParty.callbackRedirectGoogle);
	router.get(APIS.GET_3DAUTH_FACEBOOK, ctrlAuth3dParty.authFacebook);
	router.get(APIS.GET_3DAUTH_FACEBOOK_CB, ctrlAuth3dParty.authFacebookCallback, ctrlAuth3dParty.callbackRedirectFacebook);
	router.get(APIS.GET_3DAUTH_TWITTER, ctrlAuth3dParty.authTwitter);
	router.get(APIS.GET_3DAUTH_TWITTER_CB, ctrlAuth3dParty.authTwitterCallback, ctrlAuth3dParty.callbackRedirectTwitter);
	router.get(APIS.GET_3DAUTH_LINKEDIN, ctrlAuth3dParty.authLinkedin);
	router.get(APIS.GET_3DAUTH_LINKEDIN_CB, ctrlAuth3dParty.authLinkedinCallback, ctrlAuth3dParty.callbackRedirectLinkedin);

	// -----------------------------------------------------------------------------------------
	// -----------------------------------------------------------------------------------------
	// -----------------------------------------------------------------------------------------
	// 					    route middleware to authenticate and check the token.
	// 				 All routes defined BELOW will be protected by the following code!
	// -----------------------------------------------------------------------------------------
	// -----------------------------------------------------------------------------------------
	// -----------------------------------------------------------------------------------------
	router.use(restAuthMiddleware.restAuthenticationMiddleware);

	//users
	router.get(APIS.GET_USER_BY_ID, ctrlUser.usersReadOneById);
	//profile
	router.post(APIS.POST_PROFILE, ctrlProfile.update);
	//common - 3dparty + local
	router.get(APIS.GET_LOGOUT, ctrlAuthCommon.logout);
	router.get(APIS.GET_SESSIONTOKEN, ctrlAuthCommon.sessionToken);
	router.get(APIS.GET_DECODETOKEN_BY_TOKEN, ctrlAuthCommon.decodeToken);
	//3dparty auth - authorize (already logged in/connecting other social account)
	router.get(APIS.GET_CONNECT_GITHUB, ctrlAuth3dParty.connectGithub);
	router.get(APIS.GET_CONNECT_GITHUB_CB,  ctrlAuth3dParty.connectGithubCallback);
	router.get(APIS.GET_CONNECT_GOOGLE, ctrlAuth3dParty.connectGoogle);
	router.get(APIS.GET_CONNECT_GOOGLE_CB,  ctrlAuth3dParty.connectGoogleCallback);
	router.get(APIS.GET_CONNECT_FACEBOOK, ctrlAuth3dParty.connectFacebook);
	router.get(APIS.GET_CONNECT_FACEBOOK_CB,  ctrlAuth3dParty.connectFacebookCallback);
	router.get(APIS.GET_CONNECT_TWITTER, ctrlAuth3dParty.connectTwitter);
	router.get(APIS.GET_CONNECT_TWITTER_CB,  ctrlAuth3dParty.connectTwitterCallback);
	router.get(APIS.GET_CONNECT_LINKEDIN, ctrlAuth3dParty.connectLinkedin);
	router.get(APIS.GET_CONNECT_LINKEDIN_CB,  ctrlAuth3dParty.connectLinkedinCallback);
	//3dparty auth - unlink routes
	router.get(APIS.GET_UNLINK_LOCAL, ctrlAuthLocal.unlinkLocal);
	router.get(APIS.GET_UNLINK_FACEBOOK, ctrlAuth3dParty.unlinkFacebook);
	router.get(APIS.GET_UNLINK_GITHUB, ctrlAuth3dParty.unlinkGithub);
	router.get(APIS.GET_UNLINK_GOOGLE, ctrlAuth3dParty.unlinkGoogle);
	router.get(APIS.GET_UNLINK_TWITTER, ctrlAuth3dParty.unlinkTwitter);
	router.get(APIS.GET_UNLINK_LINKEDIN, ctrlAuth3dParty.unlinkLinkedin);

	module.exports = router;
	return router;
};

function isTestOrCi() {
	return config.isTest() || config.isCI();
}
