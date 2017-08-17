'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

let expect = require('chai').expect;
let app = require('../app');
let agent = require('supertest').agent(app);
let async = require('async');

require('../src/models/users');
let mongoose = require('mongoose');
// ------------------------
// as explained here http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird');
// ------------------------
let User = mongoose.model('User');

let user;
let csrftoken;
let connectionSid;

const USER_NAME = 'username';
const USER_EMAIL = 'email@email.it';
const USER_PASSWORD = 'Password1';

const registerMock = {
	name: USER_NAME,
	email : USER_EMAIL,
	password : USER_PASSWORD
};

describe('auth-local', () => {

	function updateCookiesAndTokens(done) {
		agent
		.get('/login')
		.end((err, res) => {
			if(err) {
				done(err);
			} else {
				csrftoken = (res.headers['set-cookie']).filter(value => value.includes('XSRF-TOKEN'))[0];
				connectionSid = (res.headers['set-cookie']).filter(value => value.includes('connect.sid'))[0];
			 	csrftoken = csrftoken ? csrftoken.split(';')[0].replace('XSRF-TOKEN=','') : '';
			 	connectionSid = connectionSid ? connectionSid.split(';')[0].replace('connect.sid=','') : '';
        done();
      }
    });
	}

	function registerUserTestDb(done) {
		async.waterfall([
			asyncDone => updateCookiesAndTokens(asyncDone),
			asyncDone => {
				getPartialPostRequest('/api/register')
				.set('XSRF-TOKEN', csrftoken)
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
            user = usr;
            asyncDone();
          })
          .catch(err => {
            asyncDone(err);
          });
			}
		], (err, response) => done(err));
	}

	//useful function that prevent to copy and paste the same code
	function getPartialPostRequest (apiUrl) {
		return agent
			.post(apiUrl)
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.set('set-cookie', 'connect.sid=' + connectionSid)
			.set('set-cookie', 'XSRF-TOKEN=' + csrftoken);
	}

	function dropUserCollectionTestDb(done) {
    User.remove({})
      .then(() => {
        done();
      }).catch(err => {
      fail('should not throw an error');
      done(err);
    });
	}

	describe('#activateAccount()', () => {
		describe('---YES---', () => {

			beforeEach(done => registerUserTestDb(done));

			it('should correctly activate an account', done => {
				const activateAccountMock = {
					emailToken : user.local.activateAccountToken,
					userName : USER_NAME
				};
				expect(user.local.activateAccountToken).to.be.not.undefined;
				expect(user.local.activateAccountExpires).to.be.not.undefined;
				expect(user.local.activateAccountToken).to.be.not.null;
				expect(user.local.activateAccountExpires).to.be.not.null;

				getPartialPostRequest('/api/activateAccount')
				.set('XSRF-TOKEN', csrftoken)
				.send(activateAccountMock)
				.expect(200)
				.end((err, res) => {
					if (err) {
						return done(err);
					} else {
						expect(res.body.message).to.be.equals('An e-mail has been sent to ' + USER_EMAIL + ' with further instructions.');

						User.findOne({ 'local.email': registerMock.email })
							.then(usr => {
                expect(usr.local.name).to.be.equals(USER_NAME);
                expect(usr.local.email).to.be.equals(USER_EMAIL);
                expect(usr.validPassword(USER_PASSWORD)).to.be.true;

                expect(usr.local.activateAccountToken).to.be.undefined;
                expect(usr.local.activateAccountExpires).to.be.undefined;

                done();
							})
							.catch(err1 => {
                done(err1);
							});
					}
				});
			});

			afterEach(done => dropUserCollectionTestDb(done));
		});


		describe('---NO - Wrong params/exprired---', () => {
		 	beforeEach(done => registerUserTestDb(done));

			it('should catch 404 NOT FOUND, because the token is expired', done => {
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
            getPartialPostRequest('/api/activateAccount')
              .set('XSRF-TOKEN', csrftoken)
              .send(activateAccountMock)
              .expect(404)
              .end((err, res) => {
                if (err) {
                  return done(err);
                } else {
                  console.log(res.body.message);
                  expect(res.body.message).to.be.equals('Link exprired! Your account is removed. Please, create another account, also with the same email address.');
                  done();
                }
              });
          })
          .catch(err => {
            done(err);
          });
			});


			it('should catch 404 NOT FOUND, because token is not valid', done => {
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
            getPartialPostRequest('/api/activateAccount')
              .set('XSRF-TOKEN', csrftoken)
              .send(activateAccountMock)
              .expect(404)
              .end((err, res) => {
                if (err) {
                  return done(err);
                } else {
                  console.log(res.body.message);
                  expect(res.body.message).to.be.equals('No account with that token exists.');
                  done();
                }
              });
          })
          .catch(err1 => {
            done(err1);
          });
			});

			afterEach(done => dropUserCollectionTestDb(done));
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
					getPartialPostRequest('/api/activateAccount')
					.set('XSRF-TOKEN', csrftoken)
					.send(missingUpdatePwdMocks[i])
					.expect(400)
					.end((err, res) => {
						if (err) {
							return done(err);
						} else {
							expect(res.body.message).to.be.equals("EmailToken and userName fields are required.");
							done();
						}
					});
				});
			}

			after(done => dropUserCollectionTestDb(done));
		});

		describe('---ERRORS---', () => {
			it('should get 403 FORBIDDEN, because XSRF-TOKEN is not available', done => {
				getPartialPostRequest('/api/activate')
				//XSRF-TOKEN NOT SETTED!!!!
				.send(registerMock)
				.expect(403)
				.end(() => done());
			});
		});
	});

  after(() => {
		// mongoose.disconnect();
  });
});
