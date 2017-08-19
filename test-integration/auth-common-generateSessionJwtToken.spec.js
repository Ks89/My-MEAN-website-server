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
let authCommon = require('../src/controllers/authentication/common/auth-common');

let NEW_NAME = 'Fake name';
let NEW_EMAIL = 'fake@email.com';
let NEW_PASSWORD = 'Password2';

const loginMock = {
	email : NEW_EMAIL,
	password : NEW_PASSWORD
};

const USER_MUSTBE_OBJECT = 'User must be a valid object';

const URL_LOGIN = APIS.BASE_API_PATH + APIS.POST_LOCAL_LOGIN;
const URL_BASE_DECODE_TOKEN = APIS.BASE_API_PATH + APIS.GET_DECODETOKEN + '/';

describe('auth-common', () => {

	describe('#generateSessionJwtToken()', () => {

		describe('---YES---', () => {

			beforeEach(done => testUsersUtils.insertUserTestDb(done, NEW_NAME, NEW_EMAIL, NEW_PASSWORD));

			it('should return true, because it removes the specified service.', done => {
				let parsedJwtSessionToken;

				async.waterfall([
          asyncDone => testUsersUtils.readUserLocalByEmailLocal(asyncDone, NEW_EMAIL),
          (user, asyncDone) => {
            const jwtSessionToken = authCommon.generateSessionJwtToken(user);
            parsedJwtSessionToken =  JSON.parse(jwtSessionToken).token;
            asyncDone();
          },
					asyncDone => {
						testUtils.getPartialPostRequest(URL_LOGIN)
						.set('XSRF-TOKEN', testUtils.csrftoken)
						.send(loginMock)
						.expect(200)
						.end((err, res) => asyncDone(err, res));
					},
					(res, asyncDone) => {
						testUtils.getPartialGetRequest(URL_BASE_DECODE_TOKEN + parsedJwtSessionToken)
						.send()
						.expect(200)
						.end((err, res) => {
							expect(res.body).to.be.not.undefined;
							expect(res.body).to.be.not.null;
							const usr = JSON.parse(res.body);
							expect(usr.user.local.email).to.be.equals(NEW_EMAIL);
							expect(usr.user.local.name).to.be.equals(NEW_NAME);
							expect(usr.exp).to.be.not.undefined;
							expect(usr.iat).to.be.not.undefined;
							asyncDone(err);
						});
				}], (err, response) => done(err));
			});


			afterEach(done => testUsersUtils.dropUserTestDb(done));
		});



		describe('---ERRORS---', () => {

			it('should catch an exception, because user must be a valid object', done => {

				expect(()=>authCommon.generateSessionJwtToken("")).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(-2)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(-1)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(-0)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(0)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(1)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(2)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(null)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(undefined)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(function(){})).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(()=>{})).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(/fooRegex/i)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken([])).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(new Error())).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(new RegExp(/fooRegex/,'i'))).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(new RegExp('/fooRegex/','i'))).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(new Date())).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(new Array())).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(true)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>authCommon.generateSessionJwtToken(false)).to.throw(USER_MUSTBE_OBJECT);

				done();
			});

		});
	});
});
