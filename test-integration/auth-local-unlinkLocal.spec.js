'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

const APIS = require('../src/routes/apis');

let expect = require('chai').expect;
let app = require('../app');
let agent = require('supertest').agent(app);
let async = require('async');

const TestUtils = require('../test-util/utils');
let testUtils = new TestUtils(agent);

const TestUsersUtils = require('../test-util/users');
let testUsersUtils = new TestUsersUtils(testUtils);

require('../src/models/users');
let mongoose = require('mongoose');
// ------------------------
// as explained here http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird');
// ------------------------
let User = mongoose.model('User');

const USER_NAME = 'username';
const USER_EMAIL = 'email@email.it';
const USER_PASSWORD = 'Password1';

const LOGIN_WRONG_EMAIL = 'WRONG@email.it';
const LOGIN_WRONG_PASSWORD = 'Password2';

const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};

const wrongLoginMock = {
	email : LOGIN_WRONG_EMAIL,
	password : LOGIN_WRONG_PASSWORD
};

const URL_LOGIN = APIS.BASE_API_PATH + APIS.POST_LOCAL_LOGIN;
const URL_LOGOUT = APIS.BASE_API_PATH + APIS.GET_LOGOUT;
const URL_UNLINK_LOCAL = APIS.BASE_API_PATH + APIS.GET_UNLINK_LOCAL;

describe('auth-local', () => {

	describe('#unlinkLocal()', () => {

		describe('---YES---', () => {

			beforeEach(done => testUsersUtils.insertUserTestDb(done));

			it('should correctly unlink local user (last unlink)', done => {

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

						testUtils.getPartialGetRequest(URL_UNLINK_LOCAL)
						.send()
						.expect(200)
						.end((err, res) => {
							if (err) {
								return asyncDone(err);
							} else {
								console.log(res.body);
								expect(res.body).to.be.equals("User unlinked correctly!");

								asyncDone();
							}
						});
					}
				], (err, response) => done(err));
			});

			it('should correctly unlink local user (not last unlink)', done => {
        let user;

				async.waterfall([
					asyncDone => {
            User.findOne({ 'local.email': USER_EMAIL })
              .then(usr => {
                usr.github.id = '1231232';
                usr.github.token = 'TOKEN';
                usr.github.email = 'email@email.it';
                usr.github.name = 'username';
                usr.github.username = 'username';
                usr.github.profileUrl = 'http://fakeprofileurl.com/myprofile';
                return usr.save();
              })
              .then(usr2 => {
                user = usr2;
                testUtils.updateCookiesAndTokens(asyncDone); //pass done, it's important!
              })
              .catch(err1 => {
                return asyncDone(err1);
              });
					},
					asyncDone => {
            User.findOne({ 'local.email': USER_EMAIL })
              .then(usr => {
                testUtils.updateCookiesAndTokens(asyncDone);
              }).catch(err1 => {
                return asyncDone(err1);
              });
					},
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

						testUtils.getPartialGetRequest(URL_UNLINK_LOCAL)
						.send()
						.expect(200)
						.end((err, res) => {
							if (err) {
								asyncDone(err);
							} else {
								console.log(res.body);
								expect(res.body).to.be.equals("User unlinked correctly!");
								asyncDone();
							}
						});
					},
					asyncDone => {
						User.findOne({ 'github.id': user.github.id })
              .then(usr => {
                expect(usr.local.name).to.be.undefined;
                expect(usr.local.email).to.be.undefined;
                expect(usr.local.hash).to.be.undefined;
                expect(usr.github.id).to.be.equals(user.github.id);
                expect(usr.github.token).to.be.equals(user.github.token);
                expect(usr.github.email).to.be.equals(user.github.email);
                expect(usr.github.name).to.be.equals(user.github.name);
                expect(usr.github.username).to.be.equals(user.github.username);
                expect(usr.github.profileUrl).to.be.equals(user.github.profileUrl);
                asyncDone();
              }).catch(err1 => {
                return asyncDone(err1);
              });
					}
				], (err, response) => done(err));
			});

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});

		describe('---ERRORS---', () => {

			beforeEach(done => testUsersUtils.insertUserTestDb(done));

			it('should catch 403 FORBIDDEN, because you are logged, but without your user into the db', done => {
				//I'm logged in, but for some reasons my record inside the db is missing.
				async.waterfall([
					asyncDone => {
						testUtils.getPartialPostRequest(URL_LOGIN)
						.set('XSRF-TOKEN', testUtils.csrftoken)
						.send(loginMock)
						.expect(200)
						.end((err, res) => asyncDone(err));
					},
					asyncDone => {
            User.remove({})
              .then(() => {
                asyncDone();
              }).catch(err => {
              	asyncDone(err);
            });
					},
					asyncDone => {
						testUtils.getPartialGetRequest(URL_UNLINK_LOCAL)
						.send()
						.expect(403)
						.end((err, res) => {
							expect(res.body.message).to.be.equals('User not found - cannot unlink');
							asyncDone();
						});
					}
				], (err, response) => done(err));

			});

			it('should catch 403 FORBIDDEN, because this API is available only for ' +
					'logged users. rest-auth-middleware will responde with -no token provided- message', done => {
				testUtils.getPartialGetRequest(URL_LOGOUT)
				.send()
				.expect(200)
				.end((err, res) => {
					testUtils.getPartialGetRequest(URL_UNLINK_LOCAL)
					.send()
					.expect(403)
					.end((err, res) => {
						expect(res.body.message).to.be.equals('No token provided');
						done();
					});
				});
			});

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});
	});

  // after(() => {
  //   mongoose.disconnect();
  // });
});
