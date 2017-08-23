'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

const APIS = require('../../src/routes/apis');

let expect = require('chai').expect;
let app = require('../../app');
let agent = require('supertest').agent(app);
let async = require('async');

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

const USER_NAME = 'username';
const USER_EMAIL = 'email@email.it';
const USER_PASSWORD = 'Password1';

const registerMock = {
	name: USER_NAME,
	email : USER_EMAIL,
	password : USER_PASSWORD
};

const URL_REGISTER = APIS.BASE_API_PATH + APIS.POST_LOCAL_REGISTER;
const URL_ACTIVATE_ACCOUNT = APIS.BASE_API_PATH + APIS.POST_LOCAL_ACTIVATE;
const URL_ACTIVATE_EMAIL_PATH = APIS.BASE_API_PATH + APIS.GET_LOCAL_ACTIVATE_EMAIL_URL;

describe('auth-local', () => {

	function registerUserTestDb(done) {
		async.waterfall([
			asyncDone => testUtils.updateCookiesAndTokens(asyncDone),
			asyncDone => {
				testUtils.getPartialPostRequest(URL_REGISTER)
				.set('XSRF-TOKEN', testUtils.csrftoken)
				.send(registerMock)
				.expect(200)
				.end((err, res) => asyncDone(err, res));
			},
			(res, asyncDone) => {
				expect(res.body.message).to.be.equals("User with email "  + registerMock.email + " registered.");
				User.findOne({ 'local.email': registerMock.email })
          .then(usr => {
            expect(usr.local.name).to.be.equals(registerMock.name);
            expect(usr.local.email).to.be.equals(registerMock.email);
            expect(usr.validPassword(registerMock.password));
            expect(usr.local.activateAccountExpires).to.be.not.null;
            expect(usr.local.activateAccountToken).to.be.not.null;
            expect(usr.local.activateAccountExpires).to.be.not.undefined;
            expect(usr.local.activateAccountToken).to.be.not.undefined;
            asyncDone();
          })
          .catch(err => asyncDone(err));
			}
		], (err, response) => done(err));
	}

	describe('#activateAccount()', () => {
		describe('---YES---', () => {

			beforeEach(done => registerUserTestDb(done));

			it('should correctly activate an account', done => {

        async.waterfall([
          asyncDone => testUsersUtils.readUserLocalByEmailLocal(asyncDone),
          (user, asyncDone) => {
            const activateAccountMock = {
              emailToken : user.local.activateAccountToken,
              userName : USER_NAME
            };
            expect(user.local.activateAccountToken).to.be.not.undefined;
            expect(user.local.activateAccountExpires).to.be.not.undefined;
            expect(user.local.activateAccountToken).to.be.not.null;
            expect(user.local.activateAccountExpires).to.be.not.null;

            testUtils.getPartialPostRequest(URL_ACTIVATE_ACCOUNT)
              .set('XSRF-TOKEN', testUtils.csrftoken)
              .send(activateAccountMock)
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return asyncDone(err);
                }
                expect(res.body.message).to.be.equals('An e-mail has been sent to ' + USER_EMAIL + ' with further instructions.');

                User.findOne({ 'local.email': registerMock.email })
                  .then(usr => {
                    expect(usr.local.name).to.be.equals(USER_NAME);
                    expect(usr.local.email).to.be.equals(USER_EMAIL);
                    expect(usr.validPassword(USER_PASSWORD)).to.be.true;

                    expect(usr.local.activateAccountToken).to.be.undefined;
                    expect(usr.local.activateAccountExpires).to.be.undefined;

                    asyncDone();
                  })
                  .catch(err1 => asyncDone(err1));
              });
          }
        ], (err, response) => done(err));
			});

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});


		describe('---NO - Wrong params/exprired---', () => {
		 	beforeEach(done => registerUserTestDb(done));

			it('should catch 404 NOT FOUND, because the token is expired', done => {

        async.waterfall([
          asyncDone => testUsersUtils.readUserLocalByEmailLocal(asyncDone),
          (user, asyncDone) => {
            const activateAccountMock = {
              emailToken : user.local.activateAccountToken,
              userName : USER_NAME
            };

            User.findOne({ 'local.email': USER_EMAIL })
              .then(usr => {
                expect(usr.local.activateAccountToken).to.be.not.undefined;

                console.log("token " + usr.local.activateAccountToken);
                console.log("exprires: " + usr.local.activateAccountExpires);

                usr.local.activateAccountExpires =  Date.now() - 3600000; // - 1 hour

                console.log("exprires: " + usr.local.activateAccountExpires);

                return usr.save();
              })
              .then(savedUser => {
                console.log("saved exprires: " + savedUser.local.activateAccountExpires);
                console.log(savedUser);
                testUtils.getPartialPostRequest(URL_ACTIVATE_ACCOUNT)
                  .set('XSRF-TOKEN', testUtils.csrftoken)
                  .send(activateAccountMock)
                  .expect(404)
                  .end((err, res) => {
                    if (err) {
                      return asyncDone(err);
                    }
                    console.log(res.body.message);
                    expect(res.body.message).to.be.equals('Link exprired! Your account is removed. Please, create another account, also with the same email address.');
                    asyncDone();
                  });
              })
              .catch(err => {
                asyncDone(err);
              });
          }
        ], (err, response) => done(err));
			});


			it('should catch 404 NOT FOUND, because token is not valid', done => {
        async.waterfall([
          asyncDone => testUsersUtils.readUserLocalByEmailLocal(asyncDone),
          (user, asyncDone) => {
            const activateAccountMock = {
              emailToken : user.local.activateAccountToken,
              userName : USER_NAME
            };

            User.findOne({ 'local.email': USER_EMAIL })
              .then(usr => {
                expect(usr.local.activateAccountToken).to.be.not.undefined;

                console.log("token " + usr.local.activateAccountToken);
                console.log("exprires: " + usr.local.activateAccountExpires);

                usr.local.activateAccountToken = 'random_wrong_token';

                console.log("token: " + usr.local.activateAccountToken);

                return usr.save();
              })
              .then(savedUser => {
                console.log("saved token: " + savedUser.local.activateAccountToken);
                console.log(savedUser);
                testUtils.getPartialPostRequest(URL_ACTIVATE_ACCOUNT)
                  .set('XSRF-TOKEN', testUtils.csrftoken)
                  .send(activateAccountMock)
                  .expect(404)
                  .end((err, res) => {
                    if (err) {
                      return asyncDone(err);
                    }
                    console.log(res.body.message);
                    expect(res.body.message).to.be.equals('No account with that token exists.');
                    asyncDone();
                  });
              })
              .catch(err1 => asyncDone(err1));
          }
        ], (err, response) => done(err));
			});

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});

		describe('---NO - Missing params---', () => {
			before(done => registerUserTestDb(done));

			const missingUpdatePwdMocks = [
				{emailToken : 'random email token - valid or nor is not important here'},
				{userName : USER_NAME},
				{}
			];

			//these are multiple tests that I'm execting for all cobinations
			//of wrong params
			for(let i = 0; i<missingUpdatePwdMocks.length; i++) {
				console.log(missingUpdatePwdMocks[i]);
				it('should get 400 BAD REQUEST, because emailToken and userName are mandatory. Test i=' + i, done => {
					testUtils.getPartialPostRequest(URL_ACTIVATE_ACCOUNT)
					.set('XSRF-TOKEN', testUtils.csrftoken)
					.send(missingUpdatePwdMocks[i])
					.expect(400)
					.end((err, res) => {
						if (err) {
							return done(err);
						}
            expect(res.body.message).to.be.equals("EmailToken and userName fields are required.");
            done();
					});
				});
			}

			after(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});

		describe('---ERRORS---', () => {
			it('should get 403 FORBIDDEN, because XSRF-TOKEN is not available', done => {
				testUtils.getPartialPostRequest(URL_ACTIVATE_EMAIL_PATH)
				//XSRF-TOKEN NOT SETTED!!!!
				.send(registerMock)
				.expect(403)
				.end(() => done());
			});
		});
	});
});
