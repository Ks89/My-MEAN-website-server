'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

const config = require('../../src/config');
const APIS = require('../../src/routes/apis');

let expect = require('chai').expect;
let app = require('../../app');
let agent = require('supertest').agent(app);
let async = require('async');
let jwt = require('jsonwebtoken');

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

let jwtStringToken;

const USER_NAME = 'username';
const USER_EMAIL = 'email@email.it';
const USER_PASSWORD = 'Password1';

const URL_LOGIN = APIS.BASE_API_PATH + APIS.POST_LOCAL_LOGIN;
const URL_BASE_DECODE_TOKEN = APIS.BASE_API_PATH + APIS.GET_DECODETOKEN + '/';

const jwtMock = {
	"_id": "57686655022691a4306b76b9",
	"user": {
		"_id": "57686655022691a4306b76b9",
		"__v": 0,
		"local": {
			"hash": "$2a$10$hHCcxNQmzzNCecReX1Rbeu5PJCosbjITXA1x./feykYcI2JW3npTW",
			"email": USER_EMAIL,
			"name": USER_NAME
		}
	},
	"exp": 1466721597694,
	"iat": 1466720997
};

const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};

const jwtWrongDateStringToken = function () {
	let expiry = new Date();
	expiry.setTime(expiry.getTime() - 600000); //expired 10 minutes ago (10*60*1000)

	return jwt.sign({
		_id: 'fake_id',
		//I don't want to expose private information here -> I filter
		//the user object into a similar object without some fields
		user: {
			local: {
				hash: "$2a$10$hHCcxNQmzzNCecReX1Rbeu5PJCosbjITXA1x./feykYcI2JW3npTW",
				email: USER_EMAIL,
				name: USER_NAME
			}
		},
		exp: parseFloat(expiry.getTime()),
	}, config.JWT_SECRET);
};

describe('auth-common', () => {

	function insertUserTestDb(done) {
		let user = new User();
		user.local.name = USER_NAME;
		user.local.email = USER_EMAIL;
		user.setPassword(USER_PASSWORD);
		user.save()
			.then(usr => {
        user._id = usr._id;
        jwtStringToken = user.generateJwt();
        testUtils.updateCookiesAndTokens(done); //pass done, it's important!
			})
			.catch(err => {
        done(err);
			});
	}

	describe('#decodeToken()', () => {
		describe('---YES---', () => {

			beforeEach(done => insertUserTestDb(done));

			it('should decode a jwt token', done => {

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

						testUtils.getPartialGetRequest(URL_BASE_DECODE_TOKEN + jwtStringToken)
						.send()
						.expect(200)
						.end((err, res) => {
							expect(res.body).to.be.not.undefined;
							expect(res.body).to.be.not.null;
							const usr = JSON.parse(res.body);
							expect(usr.user.local.email).to.be.equals(jwtMock.user.local.email);
							expect(usr.user.local.name).to.be.equals(jwtMock.user.local.name);
							expect(usr.exp).to.be.not.undefined;
							expect(usr.iat).to.be.not.undefined;
							asyncDone(err);
						});
					}], (err, response) => done(err));
			});

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});


		describe('---ERRORS---', () => {

			beforeEach(done => insertUserTestDb(done));

			it('should 401 UNAUTHORIZED, because token isn\'t defined', done => {
				async.waterfall([
					asyncDone => {
						testUtils.getPartialPostRequest(URL_LOGIN)
						.set('XSRF-TOKEN', testUtils.csrftoken)
						.send(loginMock)
						.expect(200)
						.end((err, res) => asyncDone(err, res));
					},
					(res, asyncDone) => {
						testUtils.getPartialGetRequest(URL_BASE_DECODE_TOKEN + 'fakeRandom')
						.send()
						.expect(401)
						.end((err, res) => {
							expect(res.body.message).to.be.equals('Jwt not valid or corrupted');
							asyncDone(err);
						});
					}], (err, response) => done(err));
			});

			it('should 401 UNAUTHORIZED, because token is expired', done => {
				async.waterfall([
					asyncDone => {
						testUtils.getPartialPostRequest(URL_LOGIN)
						.set('XSRF-TOKEN', testUtils.csrftoken)
						.send(loginMock)
						.expect(200)
						.end((err, res) => asyncDone(err, res));
					},
					(res, asyncDone) => {
						testUtils.getPartialGetRequest(URL_BASE_DECODE_TOKEN + jwtWrongDateStringToken())
						.send()
						.expect(401)
						.end((err, res) => {
							expect(res.body.message).to.be.equals('Token Session expired (date).');
							asyncDone(err);
						});
					}], (err, response) => done(err));
			});

			it('should get 401 UNAUTHORIZED, because token\'s format is wrong', done => {
				const TOKEN_WITH_WRONG_FORMAT = 'dadasd.sdasdsadas'; // with only one dot
				async.waterfall([
					asyncDone => {
						testUtils.getPartialPostRequest(URL_LOGIN)
						.set('XSRF-TOKEN', testUtils.csrftoken)
						.send(loginMock)
						.expect(200)
						.end((err, res) => asyncDone(err, res));
					},
					(res, asyncDone) => {
						testUtils.getPartialGetRequest(URL_BASE_DECODE_TOKEN + TOKEN_WITH_WRONG_FORMAT)
						.send()
						.expect(401)
						.end((err, res) => {
							expect(res.body.message).to.be.equals('Jwt not valid or corrupted');
							asyncDone(err);
						});
					}], (err, response) => done(err));
			});

			it('should get 403 FORBIDDEN, because you aren\'t authenticated', done => {
				testUtils.getPartialGetRequest(URL_BASE_DECODE_TOKEN + jwtStringToken)
				//not authenticated
				.send(loginMock)
				.expect(403)
				.end(() => done());
			});

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});
	});
});
