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
const URL_SET_STRING_SESSION = APIS.BASE_API_PATH + APIS.GET_TESTING_STRING_SESSION;
const URL_SET_JSON_WITHOUT_TOKEN_SESSION = APIS.BASE_API_PATH + APIS.GET_TESTING_JSON_NO_TOKEN;
const URL_SET_JSON_WITH_WRONGFORMAT_TOKEN_SESSION = APIS.BASE_API_PATH + APIS.GET_TESTING_JSON_WRONG_FORMAT_TOKEN;
const URL_SET_JSON_WITH_EXPIRED_DATE_SESSION = APIS.BASE_API_PATH + APIS.GET_TESTING_JSON_EXPIRED;


const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};


describe('rest-auth-middleware', () => {

	describe('#restAuthenticationMiddleware()', () => {
		describe('---YES---', () => {

			beforeEach(done => testUsersUtils.insertUserTestDb(done));

			it('should login', done => {
  			testUtils.getPartialPostRequest(URL_LOGIN)
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

		describe('---ERRORS---', () => {
      const sessionModifierUrls = [
        {url: URL_DESTROY_SESSION, msg: 'No token provided', status: 403},
        {url: URL_SET_STRING_SESSION, msg: 'No token provided', status: 403},
        {url: URL_SET_JSON_WITHOUT_TOKEN_SESSION, msg: 'Token not found', status: 404},
        {url: URL_SET_JSON_WITH_WRONGFORMAT_TOKEN_SESSION, msg: 'Jwt not valid or corrupted', status: 401},
				{url: URL_SET_JSON_WITH_EXPIRED_DATE_SESSION, msg: 'Data is not valid', status: 404}
      ];
      for(let i=0; i<sessionModifierUrls.length; i++) {
        it(`should get 403 FORBIDDEN while calling a protected service
                (for instance, logout()), because you aren't authenticated.
                Test i=${i} with ${sessionModifierUrls[i]}`, done => {
  				async.waterfall([
  					asyncDone => {
  						testUtils.getPartialGetRequest(sessionModifierUrls[i].url)
  						.send()
  						.expect(200)
  						.end((err, res) => asyncDone(err, res));
  					},
  					(res, asyncDone) => {
  						testUtils.getPartialGetRequest(URL_LOGOUT)
  						.send()
  						.expect(sessionModifierUrls[i].status) // expected status
  						.end((err, res) => {
  							// session data is modified
  							// and the rest-auth-middleware blocks your call
                // returning a specific error message
  							expect(res.body.message).to.be.equals(sessionModifierUrls[i].msg);
  							asyncDone(err);
  						});
  					}], (err, response) => done(err));
  			});
      }

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});
	});
});
