var passport = require('passport');
var authCommon = require('../common/auth-common.js');
var logger = require('../../../utils/logger.js');

//------------- INFORMATIONS to developers -------------
// GET /auth/****
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in ***** authentication will involve redirecting
//   the user to the website of *****.  After authorization, ***** will redirect the user
//   back to this application at the callbackURL.
// GET /auth/****/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to destination page.
//------------------------------------------------------

var redirectFailure = { failureRedirect: '/login' };

var connectRedirect = {
	successRedirect : '/post3dauth',
	failureRedirect : '/'
};

/**
* @api {get} /api/auth/:serviceName First authentication with a third-party service.
* @apiVersion 0.0.1
* @apiName Auth3dParty
* @apiGroup 3dPartyAuth
* @apiPermission none
*
* @apiDescription First login with <code>serviceName</code> OAUTH2. This will redirect to
*   an external website. After the login, you'll go to post3dauth's page and finally
*   to the profile page. Available servicenames: ['facebook','google','github','linkedin','twitter'].
*/
/**
* @api {get} /api/auth/:serviceName/callback First authentication callback with a third-party service.
* @apiVersion 0.0.1
* @apiName Auth3dPartyCallback
* @apiGroup 3dPartyAuth
* @apiPermission none
*
* @apiDescription First login with <code>serviceName</code> OAUTH2. This will redirect to
*   an external website and finally to the profile page.
*   Available servicenames: ['facebook','google','github','linkedin','twitter'].
*/
/**
* @api {get} /api/connect/:serviceName Connect your account (already logged in) with a third-party service.
* @apiVersion 0.0.1
* @apiName Connect3dParty
* @apiGroup 3dPartyAuth
* @apiPermission authenticate
*
* @apiDescription Connect your account (already logged in) with <code>serviceName</code>. This will redirect to
*   an external website. After the login, you'll go to post3dauth's page and finally
*   to the profile page. Available servicenames: ['facebook','google','github','linkedin','twitter'].
*/
/**
* @api {get} /api/connect/:serviceName/callback Connect your account (already logged in) with a third-party service.
* @apiVersion 0.0.1
* @apiName Connect3dPartyCallback
* @apiGroup 3dPartyAuth
* @apiPermission authenticate
*
* @apiDescription Connect your account (already logged in) with <code>serviceName</code>. This will redirect to
*   an external website and finally to the profile page.
*   Available servicenames: ['facebook','google','github','linkedin','twitter'].
*/
/**
* @api {get} /api/unlink/:serviceName Remove a service from the logged user.
* @apiVersion 0.0.1
* @apiName Auth3dParty
* @apiGroup 3dPartyAuth
* @apiPermission authenticate
*
* @apiDescription Remove <code>serviceName</code> from the logged user. This will destroy <code>serviceName</code>
*   data inside the db. The user won't login again with this <code>serviceName</code>.
*		Attention: there is an experimental feature to merge accounts created by the same user into
*   a single account.
*/
module.exports.authFacebook = passport.authenticate('facebook', { scope: ['email'] });
module.exports.authFacebookCallback = passport.authenticate('facebook', redirectFailure);
module.exports.connectFacebook = passport.authorize('facebook', { scope : 'email' });
module.exports.connectFacebookCallback = passport.authorize('facebook', connectRedirect);

module.exports.authTwitter = passport.authenticate('twitter');
module.exports.authTwitterCallback = passport.authenticate('twitter', redirectFailure);
module.exports.connectTwitter = passport.authorize('twitter');
module.exports.connectTwitterCallback = passport.authorize('twitter', connectRedirect);

module.exports.authGoogle = passport.authenticate('google', { scope: ['email', 'https://www.googleapis.com/auth/plus.login'] });
module.exports.authGoogleCallback = passport.authenticate('google', redirectFailure);
module.exports.connectGoogle = passport.authorize('google', { scope: ['email', 'https://www.googleapis.com/auth/plus.login'] });
module.exports.connectGoogleCallback = passport.authorize('google', connectRedirect);

module.exports.authGithub = passport.authenticate('github', { scope: [ 'user:email' ] });
module.exports.authGithubCallback = passport.authenticate('github', redirectFailure);
module.exports.connectGithub = passport.authorize('github', { scope: [ 'user:email' ] });
module.exports.connectGithubCallback = passport.authorize('github', connectRedirect);

module.exports.authLinkedin = passport.authenticate('linkedin', { scope: ['r_emailaddress', 'r_basicprofile'] });
module.exports.authLinkedinCallback = passport.authenticate('linkedin', redirectFailure);
module.exports.connectLinkedin = passport.authorize('linkedin', { scope: ['r_emailaddress', 'r_basicprofile'] });
module.exports.connectLinkedinCallback = passport.authorize('linkedin', connectRedirect);


//GET that represents callbacks. These functions are used to manage the object "user" returned in req.user
//All of these have this form: /auth/****serviceName****/callback
module.exports.callbackRedirectFacebook = function(req, res) {
	redirectToProfile(req.user, res, req);
};
module.exports.callbackRedirectGoogle = function(req, res) {
	redirectToProfile(req.user, res, req);
};
module.exports.callbackRedirectGithub = function(req, res) {
	redirectToProfile(req.user, res, req);
};
module.exports.callbackRedirectTwitter = function(req, res) {
	redirectToProfile(req.user, res, req);
};
module.exports.callbackRedirectLinkedin = function(req, res) {
	redirectToProfile(req.user, res, req);
};

function redirectToProfile(user, res, req) {
	console.log("callbackRedirect called");
	try {
		req.session.authToken = authCommon.generateSessionJwtToken(user);
	} catch(e) {
		logger.error(e);
		res.redirect('/home');
	}
	res.redirect('/post3dauth');
}

//GET to unlink a 3dauth user
//All of these have this form: /unlink/****serviceName****
module.exports.unlinkFacebook = function(req, res) {
	authCommon.unlinkServiceByName(req, 'facebook', res);
};
module.exports.unlinkGithub = function(req, res) {
	authCommon.unlinkServiceByName(req, 'github', res);
};
module.exports.unlinkGoogle = function(req, res) {
	authCommon.unlinkServiceByName(req, 'google', res);
};
module.exports.unlinkTwitter = function(req, res) {
	authCommon.unlinkServiceByName(req, 'twitter', res);
};
module.exports.unlinkLinkedin = function(req, res) {
	authCommon.unlinkServiceByName(req, 'linkedin', res);
};
