'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

const APIS = require('../../src/routes/apis');

let expect = require('chai').expect;
let app = require('../../app');
let agent = require('supertest').agent(app);
let async = require('async');
let _ = require('lodash');

const TestUtils = require('../test-util/utils');
let testUtils = new TestUtils(agent);

const TestUsersUtils = require('../test-util/users');
let testUsersUtils = new TestUsersUtils(testUtils);

require('../../src/models/users');
let mongoose = require('mongoose');
// ------------------------
// as explained here http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird');
// ------------------------
let User = mongoose.model('User');
let fullServiceNames = require('../../src/controllers/authentication/serviceNames');
let serviceNames = _.without(fullServiceNames, 'profile');

let user;

const USER_NAME = 'fake user';
const USER_EMAIL = 'fake@email.com';
const USER_PASSWORD = 'fake';
const FAKE_ID = 'fake_id';

const URL_LOGIN = APIS.BASE_API_PATH + APIS.POST_LOCAL_LOGIN;
const URL_LOGOUT = APIS.BASE_API_PATH + APIS.GET_LOGOUT;
const URL_BASE_UNLINK = APIS.BASE_API_PATH + APIS.GET_UNLINK_GENERIC + '/';

// testing services
const URL_DESTROY_SESSION = APIS.BASE_API_PATH + APIS.GET_TESTING_DESTROY_SESSION;
const URL_SET_JSON_WITHOUT_TOKEN_SESSION = APIS.BASE_API_PATH + APIS.GET_TESTING_JSON_NO_TOKEN;
const URL_SET_JSON_WITH_WRONGFORMAT_TOKEN_SESSION = APIS.BASE_API_PATH + APIS.GET_TESTING_JSON_WRONG_FORMAT_TOKEN;

const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};

const SESSION_NOT_VALID = 'Session not valid, probably it\'s expired';
const LOGOUT_SUCCEEDED = 'Logout succeeded';
const NO_TOKEN_PROVIDED = 'No token provided';

//this file is useful to test authCommon.unlinkServiceByName for 3dauth,
//i.e. to call /unlink/****serviceName**** in auth-3dparty.js
//indirectly I'm testing authCommon.unlinkServiceByName, call rest services /unlink/...

describe('auth-3dparty', () => {

	function insertUserTestDb(done) {
		user = new User();
		user.local.name = USER_NAME;
		user.local.email = USER_EMAIL;
		user.setPassword(USER_PASSWORD);
    user.save()
      .then(savedUser => {
        user._id = savedUser._id;
        testUtils.updateCookiesAndTokens(done); //pass done, it's important!
      })
      .catch(err => {
        done(err);
      });
	}

	function insertUserLastUnlinkTestDb(serviceName, done) {
		user = new User();
		//i'm registering a local user that i'll
		//use to login (because it's quicker than mock oauth2 authentication :)).
		//Also, I'm adding another service speicified by serviceName,
		//to do a real and useful test
		user.local.name = USER_NAME;
		user.local.email = USER_EMAIL;
		user.setPassword(USER_PASSWORD);
		if(serviceName !== 'local') {
			user[serviceName] = { id : FAKE_ID };
		}
    user.save()
      .then(savedUser => {
        user._id = savedUser._id;
        testUtils.updateCookiesAndTokens(done); //pass done, it's important!
      })
      .catch(err => {
        done(err);
      });
	}

	describe('#unlinkServiceByName()', () => {
		describe('---YES---', () => {

			describe('NO last unlink', () => {

				beforeEach(done => insertUserTestDb(done));

				for(let i=0; i<serviceNames.length; i++) {
					it('should remove ' + serviceNames[i] + ' account from an user with many other accounts [NO last unlink].', done => {
						async.waterfall([
							asyncDone => {
								testUtils.getPartialPostRequest(URL_LOGIN)
								.set('XSRF-TOKEN', testUtils.csrftoken)
								.send(loginMock)
								.expect(200)
								.end((err, res) => asyncDone(err, res));
							},
							(res, asyncDone) => {
								expect(res.body.token).to.be.not.null;
								expect(res.body.token).to.be.not.undefined;

								testUtils.getPartialGetRequest(URL_BASE_UNLINK + serviceNames[i])
								.send()
								.expect(200)
								.end((err, res) => {
									expect(res.body).to.be.equals("User unlinked correctly!");
									asyncDone(err);
								});
							}], (err, response) => done(err));
					});
				}

				afterEach(done => testUsersUtils.dropUserTestDb(done));

			});

			describe('YES LAST UNLINK', () => {
				//because I'm testing on 3dauth-unlink, I'm removing 'local'
				let services3dAuth = _.without(serviceNames, 'local');

				for(let i=0; i<services3dAuth.length; i++) {
					it('should remove ' + services3dAuth[i] + ' account from an user with only this account [YES LAST UNLINK].', done => {
						async.waterfall([
							asyncDone => insertUserLastUnlinkTestDb(services3dAuth[i], asyncDone),
							asyncDone => {
								//login as local user
								testUtils.getPartialPostRequest(URL_LOGIN)
								.set('XSRF-TOKEN', testUtils.csrftoken)
								.send(loginMock)
								.expect(200)
								.end((err, res) => asyncDone(err, res));
							},
							(res, asyncDone) => {
								//unlink local user, to leave only a 3dparty
								// service (services3dAuth[i]), because
								// in this test i want to test the last unlink's function
								expect(res.body.token).to.be.not.null;
								expect(res.body.token).to.be.not.undefined;

								testUtils.getPartialGetRequest(URL_BASE_UNLINK + 'local')
								.send()
								.expect(200)
								.end((err, res) => {
									console.log(res.body);
									expect(res.body).to.be.equals("User unlinked correctly!");
									asyncDone(err);
								});
							},
							asyncDone => {
								// I call unlink/*serviceName* to remove this account, however
								// because this is the last account into the user object,
								// this is a LAST UNLINK!!!!
								testUtils.getPartialGetRequest(URL_BASE_UNLINK + services3dAuth[i])
								.send()
								.expect(200)
								.end((err, res) => {
									expect(res.body).to.be.equals("User unlinked correctly!");
									asyncDone(err);
								});
							}], (err, response) => done(err));
					});
				}

				afterEach(done => testUsersUtils.dropUserTestDb(done));

			});
		});


		describe('---ERRORS---', () => {

			beforeEach(done => insertUserTestDb(done));

			for(let i=0; i<serviceNames.length; i++) {
				it('should get 403 FORBIDDEN, because you aren\'t authenticated. Test serviceName=' + serviceNames[i], done => {
					testUtils.getPartialGetRequest(URL_BASE_UNLINK + serviceNames[i])
					//not authenticated
					.send(loginMock)
					.expect(403)
					.end(() => done());
				});


				it('should catch an exception, because the session is not valid or expired.', done => {

					async.waterfall([
						asyncDone => {
							testUtils.getPartialPostRequest(URL_LOGIN)
							.set('XSRF-TOKEN', testUtils.csrftoken)
							.send(loginMock)
							.expect(200)
							.end((err, res) => asyncDone(err, res));
						},
						(res, asyncDone) => {
							testUtils.getPartialGetRequest(URL_LOGOUT)
							.send()
							.expect(200)
							.end((err, res) => {
								expect(res.body.message).to.be.equals(LOGOUT_SUCCEEDED);
								asyncDone(err, res);
							});
						},
						(res, asyncDone) => {
							console.log(res.body);

							testUtils.getPartialGetRequest(URL_BASE_UNLINK + serviceNames[i])
							.send()
							.expect(403)
							.end((err, res) => {
								console.log(res.body);
								expect(res.body.message).to.be.equals(NO_TOKEN_PROVIDED);
								asyncDone(err);
							});
						}], (err, response) => done(err));
				});
			}

			for(let i=0; i<serviceNames.length; i++) {
				it('should get 403 FORBIDDEN, because you aren\'t authenticated. Test serviceName=' + serviceNames[i], done => {
					testUtils.getPartialGetRequest(URL_BASE_UNLINK + serviceNames[i])
					//not authenticated
					.send(loginMock)
					.expect(403)
					.end(() => done());
				});

				it('should catch an exception, because the session is not valid or expired. Test serviceName=' + serviceNames[i], done => {

					async.waterfall([
						asyncDone => {
							testUtils.getPartialPostRequest(URL_LOGIN)
							.set('XSRF-TOKEN', testUtils.csrftoken)
							.send(loginMock)
							.expect(200)
							.end((err, res) => {
                User.remove({})
                  .then(() => {
                    asyncDone(null, res);
                  }).catch(err => {
                  	asyncDone(err, res);
									});
							});
						},
						(res, asyncDone) => {
							console.log(res.body);
							testUtils.getPartialGetRequest(URL_BASE_UNLINK + serviceNames[i])
							.send()
							.expect(404)
							.end((err, res) => {
								expect(res.body.message).to.be.equals('User not found - cannot unlink');
								asyncDone(err);
							});
						}], (err, response) => done(err));
				});
			}

			for(let i=0; i<serviceNames.length; i++) {
				it('should catch 404 NOT FOUND, because the session is not valid.' +
						'----Implemented with the rest-auth-middleware bypass---. serviceName=' + serviceNames[i], done => {

					async.waterfall([
						asyncDone => {
							testUtils.getPartialPostRequest(URL_LOGIN)
							.set('XSRF-TOKEN', testUtils.csrftoken)
							.send(loginMock)
							.expect(200)
							.end((err, res) => asyncDone(err, res));
						},
						(res, asyncDone) => {
							expect(res.body.token).to.be.not.null;
							expect(res.body.token).to.be.not.undefined;
							console.log(res.body);

							testUtils.getPartialGetRequest(URL_DESTROY_SESSION)
							.send()
							.expect(200)
							.end((err, res) => asyncDone(err, res));
						},
						(res, asyncDone) => {
							// BYPASS rest-auth-middleware
							process.env.DISABLE_REST_AUTH_MIDDLEWARE = 'yes';

							testUtils.getPartialGetRequest(URL_BASE_UNLINK + serviceNames[i])
							.send()
							.expect(401)
							.end((err, res) => {
								// thanks to the rest-auth-middleware bypass, this message is
								// thrown by unlinkServiceByName and not by the rest-auth-middleware itself.
								expect(res.body.message).to.be.equals(SESSION_NOT_VALID);

								// RESTORE rest-auth-middleware
								delete process.env.DISABLE_REST_AUTH_MIDDLEWARE;
								asyncDone(err);
							});
						}
					], (err, response) => done(err));
				});
			}



			for(let i=0; i<serviceNames.length; i++) {
				it('should catch 401 UNAUTHORIZED, because session token is not available.' +
						'----Implemented with the rest-auth-middleware bypass---. serviceName=' + serviceNames[i], done => {

					async.waterfall([
						asyncDone => {
							testUtils.getPartialPostRequest(URL_LOGIN)
							.set('XSRF-TOKEN', testUtils.csrftoken)
							.send(loginMock)
							.expect(200)
							.end((err, res) => asyncDone(err, res));
						},
						(res, asyncDone) => {
							expect(res.body.token).to.be.not.null;
							expect(res.body.token).to.be.not.undefined;
							console.log(res.body);

							testUtils.getPartialGetRequest(URL_SET_JSON_WITHOUT_TOKEN_SESSION)
							.send()
							.expect(200)
							.end((err, res) => asyncDone(err, res));
						},
						(res, asyncDone) => {
							// BYPASS rest-auth-middleware
							process.env.DISABLE_REST_AUTH_MIDDLEWARE = 'yes';

							testUtils.getPartialGetRequest(URL_BASE_UNLINK + serviceNames[i])
							.send()
							.expect(401)
							.end((err, res) => {
								// thanks to the rest-auth-middleware bypass, this message is
								// thrown by unlinkServiceByName and not by the rest-auth-middleware itself.
								expect(res.body.message).to.be.equals('Token not found');

								// RESTORE rest-auth-middleware
								delete process.env.DISABLE_REST_AUTH_MIDDLEWARE;
								asyncDone(err);
							});
						}
					], (err, response) => done(err));
				});
			}


			for(let i=0; i<serviceNames.length; i++) {
				it('should catch 401 UNAUTHORIZED, because session token\'s format is wrong.' +
						'----Implemented with the rest-auth-middleware bypass---. serviceName=' + serviceNames[i], done => {

					async.waterfall([
						asyncDone => {
							testUtils.getPartialPostRequest(URL_LOGIN)
							.set('XSRF-TOKEN', testUtils.csrftoken)
							.send(loginMock)
							.expect(200)
							.end((err, res) => asyncDone(err, res));
						},
						(res, asyncDone) => {
							expect(res.body.token).to.be.not.null;
							expect(res.body.token).to.be.not.undefined;
							console.log(res.body);

							testUtils.getPartialGetRequest(URL_SET_JSON_WITH_WRONGFORMAT_TOKEN_SESSION)
							.send()
							.expect(200)
							.end((err, res) => asyncDone(err, res));
						},
						(res, asyncDone) => {
							// BYPASS rest-auth-middleware
							process.env.DISABLE_REST_AUTH_MIDDLEWARE = 'yes';

							testUtils.getPartialGetRequest(URL_BASE_UNLINK + serviceNames[i])
							.send()
							.expect(401)
							.end((err, res) => {
								// thanks to the rest-auth-middleware bypass, this message is
								// thrown by unlinkServiceByName and not by the rest-auth-middleware itself.
								expect(res.body.message).to.be.equals('Jwt not valid or corrupted');

								// RESTORE rest-auth-middleware
								delete process.env.DISABLE_REST_AUTH_MIDDLEWARE;
								asyncDone(err);
							});
						}
					], (err, response) => done(err));
				});
			}

			afterEach(done => testUsersUtils.dropUserTestDb(done));
		});
	});
});
