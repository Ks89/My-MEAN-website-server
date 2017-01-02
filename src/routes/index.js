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
	router.get('/projects', ctrlProjects.projectsList);
	router.get('/projecthome', ctrlProjects.projectsListHomepage);
	router.get('/projects/:projectid', ctrlProjects.projectsReadOne);
	//contacts
	router.post('/email', ctrlContact.sendEmailWithRecaptcha);

	//-----------------------------------------------------------------------------------------
	//-----------------------------------authentication----------------------------------------
	//-----------------------------------------------------------------------------------------
	//local
	router.post('/register', ctrlAuthLocal.register);
	router.post('/login', ctrlAuthLocal.login);
	router.post('/reset', ctrlAuthLocal.reset);
	router.post('/resetNewPassword', ctrlAuthLocal.resetPasswordFromEmail);
	router.post('/activateAccount', ctrlAuthLocal.activateAccount);
	//3dparty - first login
	router.get('/auth/github', ctrlAuth3dParty.authGithub);
	router.get('/auth/github/callback', ctrlAuth3dParty.authGithubCallback, ctrlAuth3dParty.callbackRedirectGithub);
	router.get('/auth/google', ctrlAuth3dParty.authGoogle);
	router.get('/auth/google/callback', ctrlAuth3dParty.authGoogleCallback, ctrlAuth3dParty.callbackRedirectGoogle);
	router.get('/auth/facebook', ctrlAuth3dParty.authFacebook);
	router.get('/auth/facebook/callback', ctrlAuth3dParty.authFacebookCallback, ctrlAuth3dParty.callbackRedirectFacebook);
	router.get('/auth/twitter', ctrlAuth3dParty.authTwitter);
	router.get('/auth/twitter/callback', ctrlAuth3dParty.authTwitterCallback, ctrlAuth3dParty.callbackRedirectTwitter);
	router.get('/auth/linkedin', ctrlAuth3dParty.authLinkedin);
	router.get('/auth/linkedin/callback', ctrlAuth3dParty.authLinkedinCallback, ctrlAuth3dParty.callbackRedirectLinkedin);

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
	router.get('/users/:id', ctrlUser.usersReadOneById);
	//profile
	router.post('/profile', ctrlProfile.update);
	//common - 3dparty + local
	router.get('/logout', ctrlAuthCommon.logout);
	router.get('/sessionToken', ctrlAuthCommon.sessionToken);
	router.get('/decodeToken/:token', ctrlAuthCommon.decodeToken);
	//3dparty auth - authorize (already logged in/connecting other social account)
	router.get('/connect/github', ctrlAuth3dParty.connectGithub);
	router.get('/connect/github/callback', ctrlAuth3dParty.connectGithubCallback);
	router.get('/connect/google', ctrlAuth3dParty.connectGoogle);
	router.get('/connect/google/callback', ctrlAuth3dParty.connectGoogleCallback);
	router.get('/connect/facebook', ctrlAuth3dParty.connectFacebook);
	router.get('/connect/facebook/callback', ctrlAuth3dParty.connectFacebookCallback);
	router.get('/connect/twitter', ctrlAuth3dParty.connectTwitter);
	router.get('/connect/twitter/callback', ctrlAuth3dParty.connectTwitterCallback);
	router.get('/connect/linkedin', ctrlAuth3dParty.connectLinkedin);
	router.get('/connect/linkedin/callback', ctrlAuth3dParty.connectLinkedinCallback);
	//3dparty auth - unlink routes
	router.get('/unlink/local', ctrlAuthLocal.unlinkLocal);
	router.get('/unlink/facebook', ctrlAuth3dParty.unlinkFacebook);
	router.get('/unlink/github', ctrlAuth3dParty.unlinkGithub);
	router.get('/unlink/google', ctrlAuth3dParty.unlinkGoogle);
	router.get('/unlink/twitter', ctrlAuth3dParty.unlinkTwitter);
	router.get('/unlink/linkedin', ctrlAuth3dParty.unlinkLinkedin);

	module.exports = router;
	return router;
};

function isTestOrCi() {
	return process.env.NODE_ENV === 'test' || process.env.CI;
}
