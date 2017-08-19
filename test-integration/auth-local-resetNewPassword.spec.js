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

const resetMock = {
	email : USER_EMAIL
};

const NEW_PASSWORD = 'NewPassword2';

const URL_RESET = APIS.BASE_API_PATH + APIS.POST_LOCAL_RESET;
const URL_RESET_PWD_FROM_MAIL = APIS.BASE_API_PATH + APIS.POST_LOCAL_RESET_PWD_FROM_MAIL;

describe('auth-local', () => {

	function registerUserTestDb(done) {
	  let user;

		async.waterfall([
			asyncDone => {
				user = new User();
				user.local.name = USER_NAME;
				user.local.email = USER_EMAIL;
				user.setPassword(USER_PASSWORD);
				user.save()
          .then(usr => {
            testUtils.updateCookiesAndTokens(asyncDone);
          }).catch(err => {
            asyncDone(err);
          });
			},
			asyncDone => {
				testUtils.getPartialPostRequest(URL_RESET)
				.set('XSRF-TOKEN', testUtils.csrftoken)
				.send(resetMock)
				.expect(200)
				.end((err, res) => {
					if (err) {
						return asyncDone(err);
					}
          expect(res.body.message).to.be.equals('An e-mail has been sent to ' + USER_EMAIL + ' with further instructions.');
          User.findOne({ 'local.email': resetMock.email })
            .then(usr => {
              expect(usr.local.name).to.be.equals(USER_NAME);
              expect(usr.local.email).to.be.equals(USER_EMAIL);
              expect(usr.validPassword(USER_PASSWORD));
              expect(usr.local.resetPasswordExpires).to.be.not.undefined;
              expect(usr.local.resetPasswordToken).to.be.not.undefined;

              user.local.resetPasswordToken = usr.local.resetPasswordToken;
              user.local.resetPasswordExpires = usr.local.resetPasswordExpires;

              asyncDone();
            }).catch(err1 => {
              asyncDone(err1);
            });
				});
			}
		], err => done(err));
	}

	describe('#resetPasswordFromEmail()', () => {
		describe('---YES---', () => {

			beforeEach(done => registerUserTestDb(done));

			it('should correctly update the password after the reset', done => {
        async.waterfall([
          asyncDone => {
            testUsersUtils.readUserLocalByEmailLocal(asyncDone);
          },
          (user, asyncDone) => {
            const updateResetPwdMock = {
              newPassword : NEW_PASSWORD,
              emailToken : user.local.resetPasswordToken
            };

            testUtils.getPartialPostRequest(URL_RESET_PWD_FROM_MAIL)
              .set('XSRF-TOKEN', testUtils.csrftoken)
              .send(updateResetPwdMock)
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return asyncDone(err);
                }
                console.log(res.body.message);
                expect(res.body.message).to.be.equals('An e-mail has been sent to ' + USER_EMAIL + ' with further instructions.');
                User.findOne({ 'local.email': resetMock.email })
                  .then(usr => {
                    expect(usr.local.name).to.be.equals(USER_NAME);
                    expect(usr.local.email).to.be.equals(USER_EMAIL);
                    expect(usr.local.resetPasswordExpires).to.be.undefined;
                    expect(usr.local.resetPasswordToken).to.be.undefined;

                    expect(usr.validPassword(NEW_PASSWORD)).to.be.true;
                    expect(usr.validPassword(USER_PASSWORD)).to.be.false;

                    asyncDone();
                  })
                  .catch(err1 => {
                    asyncDone(err1);
                  });
              });
          }
        ], err => done(err));
			});

			afterEach(done => testUsersUtils.dropUserTestDb(done));
		});


		describe('---NO - token expired or not valid---', () => {
			beforeEach(done => registerUserTestDb(done));

			it('should catch 404 NOT FOUND, because the token is exprired', done => {
        async.waterfall([
          asyncDone => {
            testUsersUtils.readUserLocalByEmailLocal(asyncDone);
          },
          (user, asyncDone) => {
            const updateResetPwdMock = {
              newPassword : NEW_PASSWORD,
              emailToken : user.local.resetPasswordToken
            };

            User.findOne({ 'local.email': resetMock.email })
              .then(usr => {
                expect(usr.local.resetPasswordToken).to.be.not.undefined;
                usr.local.resetPasswordExpires =  Date.now() - 3600000; // - 1 hour
                return usr.save();
              })
              .then(savedUser => {
                testUtils.getPartialPostRequest(URL_RESET_PWD_FROM_MAIL)
                  .set('XSRF-TOKEN', testUtils.csrftoken)
                  .send(updateResetPwdMock)
                  .expect(404)
                  .end((err, res) => {
                    if (err) {
                      return asyncDone(err);
                    }
                    expect(res.body.message).to.be.equals('No account with that token exists.');
                    asyncDone();
                  });
              })
              .catch(err => asyncDone(err));
          }
        ], err => done(err));
			});


			it('should catch 404 NOT FOUND, because token is not valid', done => {
        async.waterfall([
          asyncDone => {
            testUsersUtils.readUserLocalByEmailLocal(asyncDone);
          },
          (user, asyncDone) => {
            const updateResetPwdMock = {
              newPassword : NEW_PASSWORD,
              emailToken : user.local.resetPasswordToken
            };

            User.findOne({ 'local.email': resetMock.email })
              .then(usr => {
                expect(usr.local.resetPasswordToken).to.be.not.undefined;
                usr.local.resetPasswordExpires =  Date.now() - 3600000; // - 1 hour
                return usr.save();
              })
              .then(savedUser => {
                testUtils.getPartialPostRequest(URL_RESET_PWD_FROM_MAIL)
                  .set('XSRF-TOKEN', testUtils.csrftoken)
                  .send(updateResetPwdMock)
                  .expect(404)
                  .end((err, res) => {
                    if (err) {
                      return asyncDone(err);
                    }
                    expect(res.body.message).to.be.equals('No account with that token exists.');
                    asyncDone();
                  });
              })
              .catch(err => asyncDone(err));
          }
        ], err => done(err));
			});

			afterEach(done => testUsersUtils.dropUserTestDb(done));
		});

		describe('---NO - Missing params---', () => {
			beforeEach(done => registerUserTestDb(done));

			const missingUpdatePwdMocks = [
				{newPassword : NEW_PASSWORD},
				{emailToken : 'random email token - valid or nor is not important here'},
				{}
			];

			//these are multiple tests that I'm expecting for all combinations
			//of wrong params
			for(let i = 0; i<missingUpdatePwdMocks.length; i++) {
				console.log(missingUpdatePwdMocks[i]);
				it('should get 400 BAD REQUEST, because password and emailToken are mandatory. Test i=' + i, done => {
					testUtils.getPartialPostRequest(URL_RESET_PWD_FROM_MAIL)
					.set('XSRF-TOKEN', testUtils.csrftoken)
					.send(missingUpdatePwdMocks[i])
					.expect(400)
					.end((err, res) => {
						if (err) {
							return done(err);
						}
            expect(res.body.message).to.be.equals("Password and emailToken fields are required.");
            done(err);
					});
				});
			}

			afterEach(done => testUsersUtils.dropUserTestDb(done));
		});

		describe('---ERRORS---', () => {
			it('should get 403 FORBIDDEN, because XSRF-TOKEN is not available', done => {
				testUtils.getPartialPostRequest(URL_RESET_PWD_FROM_MAIL)
				//XSRF-TOKEN NOT SETTED!!!!
				.send(resetMock)
				.expect(403)
				.end(() => done());
			});
		});
	});
});
