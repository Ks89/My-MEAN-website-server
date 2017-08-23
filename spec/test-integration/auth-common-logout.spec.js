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

const URL_LOGIN = APIS.BASE_API_PATH + APIS.POST_LOCAL_LOGIN;
const URL_LOGOUT = APIS.BASE_API_PATH + APIS.GET_LOGOUT;

// testing services
const URL_DESTROY_SESSION = APIS.BASE_API_PATH + APIS.GET_TESTING_DESTROY_SESSION;

const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};


describe('auth-common', () => {

	describe('#logout()', () => {
		describe('---YES---', () => {

			beforeEach(done => testUsersUtils.insertUserTestDb(done));

			it('should logout', done => {

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

						testUtils.getPartialGetRequest(URL_LOGOUT)
						.send()
						.expect(200)
						.end((err, res) => {
							expect(res.body.message).to.be.equals('Logout succeeded');
							asyncDone(err);
						});
					}], (err, response) => done(err));
			});

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});


		describe('---ERRORS---', () => {

			beforeEach(done => testUsersUtils.insertUserTestDb(done));

			it('should get 403 FORBIDDEN, because you aren\'t authenticated', done => {
				testUtils.getPartialGetRequest(URL_LOGOUT)
				//not authenticated
				.send(loginMock)
				.expect(403)
				.end(() => done());
			});

			it('should get 404 NOT FOUND, because session token is not available', done => {
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

						testUtils.getPartialGetRequest(URL_LOGOUT)
						.send()
						.expect(404)
						.end((err, res) => {
							expect(res.body.message).to.be.equals('Authtoken not available as session data');

							// RESTORE rest-auth-middleware
							delete process.env.DISABLE_REST_AUTH_MIDDLEWARE;
							asyncDone(err);
						});
					}], (err, response) => done(err));
			});

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});
	});
});
