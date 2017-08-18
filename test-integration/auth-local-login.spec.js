'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

let expect = require('chai').expect;
let app = require('../app');
let agent = require('supertest').agent(app);

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

describe('auth-local', () => {

	describe('#login()', () => {
		describe('---YES---', () => {

			beforeEach(done => testUsersUtils.insertUserTestDb(done));

			it('should correctly login', done => {
				testUtils.getPartialPostRequest('/api/login')
				.set('XSRF-TOKEN', testUtils.csrftoken)
				.send(loginMock)
				.expect(200)
				.end((err, res) => {
					if (err) {
						return done(err);
					} else {
						expect(res.body.token).to.be.not.null;
						expect(res.body.token).to.be.not.undefined;
						done(err);
					}
				});
			});

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});

		describe('---NO - Wrong params---', () => {
			before(done => testUsersUtils.insertUserTestDb(done));

			const wrongLoginMocks = [
				{email : USER_EMAIL, password : LOGIN_WRONG_PASSWORD},
				{email: LOGIN_WRONG_EMAIL, password : USER_PASSWORD},
				{email : LOGIN_WRONG_EMAIL, password : LOGIN_WRONG_PASSWORD}
			];

			//these are multiple tests that I'm execting for all cobinations
			//of wrong params
			for(let i = 0; i<wrongLoginMocks.length; i++) {
				console.log(wrongLoginMocks[i]);
				it('should get 401 UNAUTHORIZED, because the correct input params are wrong. Test i= ' + i, done => {
					testUtils.getPartialPostRequest('/api/login')
					.set('XSRF-TOKEN', testUtils.csrftoken)
					.send(wrongLoginMocks[i])
					.expect(401)
					.end((err, res) => {
						if (err) {
							return done(err);
						} else {
							expect(res.body.message).to.be.equals("Incorrect username or password. Or this account is not activated, check your mailbox.");
							done(err);
						}
					});
				});
			}

			it('should get 400 BAD REQUEST, because the correct input params are wrong ' +
				'(passed name and blabla insted of emailand password).', done => {

				testUtils.getPartialPostRequest('/api/login')
				.set('XSRF-TOKEN', testUtils.csrftoken)
				.send({name: 'wrong_name_param', blabla: 'wrong_name_param', })
				.expect(400)
				.end((err, res) => {
					if (err) {
						return done(err);
					} else {
						expect(res.body.message).to.be.equals("All fields required");
						done(err);
					}
				});
			});

			after(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});

		describe('---NO - MISSING params---', () => {
			before(done => testUsersUtils.insertUserTestDb(done));

			const missingLoginMocks = [
				{email: USER_EMAIL},
				{password : USER_PASSWORD},
				{}
			];

			//these are multiple tests that I'm execting for all cobinations
			//of missing params
			for(let i = 0; i<missingLoginMocks.length; i++) {
				console.log(missingLoginMocks[i]);

				it('should get 400 BAD REQUEST, because input params are missing. Test i= ' + i, done => {
					testUtils.getPartialPostRequest('/api/login')
					.set('XSRF-TOKEN', testUtils.csrftoken)
					.send(missingLoginMocks[i])
					.expect(400)
					.end((err, res) => {
						if (err) {
							return done(err);
						} else {
							expect(res.body.message).to.be.equals("All fields required");
							done(err);
						}
					});
				});
			}

			after(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});

		describe('---NO - NOT ACTIVATED---', () => {
			before(done => testUsersUtils.insertUserTestDb(done));

			const activateCombinations = [
				{token : 'FAKE_TOKEN', expires : new Date()},
				{token : 'FAKE_TOKEN', expires : undefined},
				{token : undefined, expires : new Date()}
			];

			//these are multiple tests that I'm execting for all cobinations
			//of activation token+expires
			for(let i = 0; i<activateCombinations.length; i++) {
				console.log(activateCombinations[i]);

				it('should get 401 UNAUTHORIZED, because this account is not activated. Test i= ' + i, done => {
					before(done => {
						let user = new User();
						user.local.name = USER_NAME;
						user.local.email = USER_EMAIL;
						user.setPassword(USER_PASSWORD);
						user.local.activateAccountToken = activateCombinations[i].token;
						user.local.activateAccountExpires = activateCombinations[i].expires;
						user.save()
							.then(usr => {
                user._id = usr._id;
                testUtils.updateCookiesAndTokens(done); //pass done, it's important!
							})
							.catch(err => {
                done(err);
							});
					});

					testUtils.getPartialPostRequest('/api/login')
					.set('XSRF-TOKEN', testUtils.csrftoken)
					.send(wrongLoginMock)
					.expect(401)
					.end((err, res) => {
						if (err) {
							return done(err);
						} else {
							expect(res.body.message).to.be.equals("Incorrect username or password. Or this account is not activated, check your mailbox.");
							done(err);
						}
					});
				});

				after(done => testUsersUtils.dropUserTestDbAndLogout(done));
			}
		});

		describe('---ERRORS---', () => {
			it('should get 403 FORBIDDEN, because XSRF-TOKEN is not available', done => {
				testUtils.getPartialPostRequest('/api/login')
				//XSRF-TOKEN NOT SETTED!!!!
				.send(loginMock)
				.expect(403)
				.end(() => done());
			});
		});
	});

  // after(() => {
  //   mongoose.disconnect();
  // });
});
