'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

const APIS = require('../../src/routes/apis');

let expect = require('chai').expect;
let app = require('../../app');
let agent = require('supertest').agent(app);

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

const RESET_WRONG_EMAIL = 'notexisting@email.com';

const resetMock = {
	email : USER_EMAIL
};

const wrongResetMock = {
	email : RESET_WRONG_EMAIL
};

const URL_RESET = APIS.BASE_API_PATH + APIS.POST_LOCAL_RESET;

describe('auth-local', () => {

	describe('#reset()', () => {
		describe('---YES---', () => {

			beforeEach(done => testUsersUtils.insertUserTestDb(done));

			it('should correctly reset password', done => {
				testUtils.getPartialPostRequest(URL_RESET)
				.set('XSRF-TOKEN', testUtils.csrftoken)
				.send(resetMock)
				.expect(200)
				.end((err, res) => {
					if (err) {
						return done(err);
					}
          expect(res.body.message).to.be.equals('An e-mail has been sent to ' + USER_EMAIL + ' with further instructions.');
          if(err) {
            done(err);
          }
          User.findOne({ 'local.email': resetMock.email })
            .then(user => {
              expect(user.local.name).to.be.equals(USER_NAME);
              expect(user.local.email).to.be.equals(USER_EMAIL);
              expect(user.validPassword(USER_PASSWORD)).to.be.true;
              expect(user.local.resetPasswordExpires).to.be.not.null;
              expect(user.local.resetPasswordToken).to.be.not.null;
              expect(user.local.resetPasswordExpires).to.be.not.undefined;
              expect(user.local.resetPasswordToken).to.be.not.undefined;
              done();
            })
            .catch(err1 => done(err1));
				});
			});

			afterEach(done => testUsersUtils.dropUserTestDb(done));
		});


		describe('---NO - MISSING params---', () => {
			before(done => testUsersUtils.insertUserTestDb(done));

			const missingLoginMocks = [
				{email : null},
				{email : undefined},
				{}
			];

			//these are multiple tests that I'm execting for all cobinations
			//of wrong params
			for(let i = 0; i<missingLoginMocks.length; i++) {
				console.log(missingLoginMocks[i]);
				it('should get 400 BAD REQUEST, because email param is mandatory.', done => {
					testUtils.getPartialPostRequest(URL_RESET)
					.set('XSRF-TOKEN', testUtils.csrftoken)
					.send(missingLoginMocks[i])
					.expect(400)
					.end((err, res) => {
						if (err) {
							return done(err);
						}
            expect(res.body.message).to.be.equals("Email fields is required.");
            done();
					});
				});
			}

			it('should get 404 NOT FOUND, because the request email is not found.', done => {
				testUtils.getPartialPostRequest(URL_RESET)
				.set('XSRF-TOKEN', testUtils.csrftoken)
				.send({email : RESET_WRONG_EMAIL})
				.expect(404)
				.end((err, res) => {
					if (err) {
						return done(err);
					}
					console.log(res.body.message);
          expect(res.body.message).to.be.equals("No account with that email address exists.");
          done();
				});
			});

			after(done => testUsersUtils.dropUserTestDb(done));
		});

		describe('---ERRORS---', () => {
			it('should get 403 FORBIDDEN, because XSRF-TOKEN is not available', done => {
				testUtils.getPartialPostRequest(URL_RESET)
				//XSRF-TOKEN NOT SETTED!!!!
				.send(resetMock)
				.expect(403)
				.end(() => done());
			});
		});
	});
});
