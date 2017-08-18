'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

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

let NEW_NAME = 'Fake name';
let NEW_EMAIL = 'fake@email.com';
let NEW_PASSWORD = 'Password2';

const registerMock = {
	name: NEW_NAME,
	email : NEW_EMAIL,
	password : NEW_PASSWORD
};

describe('auth-local', () => {

	describe('#register()', () => {

		beforeEach(done => testUsersUtils.dropUserTestDb(done));

		describe('---YES---', () => {

			beforeEach(done => testUtils.updateCookiesAndTokens(done));

			it('should correctly register a new user', done => {
	    		testUtils.getPartialPostRequest('/api/register')
				.set('XSRF-TOKEN', testUtils.csrftoken)
				.send(registerMock)
				.expect(200)
				.end((err, res) => {
					if (err) {
						return done(err);
					}
          expect(res.body.message).to.be.equals("User with email "  + registerMock.email + " registered.");

          User.findOne({ 'local.email': registerMock.email })
            .then(user => {
              expect(user.local.name).to.be.equals(registerMock.name);
              expect(user.local.email).to.be.equals(registerMock.email);
              expect(user.validPassword(registerMock.password));
              expect(user.local.activateAccountExpires).to.be.not.null;
              expect(user.local.activateAccountToken).to.be.not.null;
              expect(user.local.activateAccountExpires).to.be.not.undefined;
              expect(user.local.activateAccountToken).to.be.not.undefined;
              done();
            })
            .catch(err1 => done(err1));
				});
			});

			afterEach(done => testUsersUtils.dropUserTestDb(done));
		});

		describe('---NO---', () => {
			beforeEach(done => testUtils.updateCookiesAndTokens(done));

			it('should get 400 BAD REQUEST, because user already exists', done => {
				async.waterfall([
					asyncDone => testUsersUtils.insertUserTestDb(asyncDone, NEW_NAME, NEW_EMAIL, NEW_PASSWORD),
					asyncDone => {
						testUtils.getPartialPostRequest('/api/register')
						.set('XSRF-TOKEN', testUtils.csrftoken)
						.send(registerMock)
						.expect(400)
						.end((err, res) => {
							if (err) {
								asyncDone(err, null);
							} else {
								asyncDone(err, res);
							}
						});
					}
				], (err, res) => {
					if (err) {
						return done(err);
					}
          expect(res.body.message).to.be.equals("User already exists. Try to login.");
          done();
				});
			});

			afterEach(done => testUsersUtils.dropUserTestDb(done));
		});


		describe('---NO - Wrong/Missing params---', () => {
			beforeEach(done => testUtils.updateCookiesAndTokens(done));

			const wrongRegisterMocks = [
				{name: NEW_NAME, email : NEW_EMAIL},
				{name: NEW_NAME, password : NEW_PASSWORD},
				{email : NEW_EMAIL, password : NEW_PASSWORD},
				{name: NEW_NAME},
				{email : NEW_EMAIL},
				{password : NEW_PASSWORD},
				{}
			];

			//these are multiple tests that I'm execting for all cobinations
			//of missing params
			for(let i = 0; i<wrongRegisterMocks.length; i++) {
				console.log(wrongRegisterMocks[i]);
        beforeEach(done => testUtils.updateCookiesAndTokens(done));

        it('should get 400 BAD REQUEST, because you must pass all mandatory params. Test i= ' + i, done => {

					async.waterfall([
						asyncDone => testUsersUtils.insertUserTestDb(asyncDone, NEW_NAME, NEW_EMAIL, NEW_PASSWORD),
						asyncDone => {
							testUtils.getPartialPostRequest('/api/register')
							.set('XSRF-TOKEN', testUtils.csrftoken)
							.send(wrongRegisterMocks[i])
							.expect(400)
							.end((err, res) => {
								if (err) {
									asyncDone(err, null);
								} else {
									asyncDone(null, res.body);
								}
							});
						}
					], (err, response) => {
						if (err) {
							return done(err);
						}
            expect(response.message).to.be.equals("All fields required");
            done();
					});

				});
        afterEach(done => testUsersUtils.dropUserTestDb(done));
      }

			afterEach(done => testUsersUtils.dropUserTestDb(done));
		});

		describe('---ERRORS---', () => {
			it('should get 403 FORBIDDEN, because XSRF-TOKEN is not available', done => {
				testUtils.getPartialPostRequest('/api/register')
				//XSRF-TOKEN NOT SETTED!!!!
				.send(registerMock)
				.expect(403)
				.end(() => done());
			});
		});
	});
});
