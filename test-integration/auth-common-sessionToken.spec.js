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

const USER_NAME = 'fake user';
const USER_EMAIL = 'fake@email.com';
const USER_PASSWORD = 'fake';

const URL_LOGIN = '/api/login';
const URL_LOGOUT = '/api/logout';
const URL_SESSIONTOKEN = '/api/sessionToken';

// testing services
const URL_DESTROY_SESSION = '/api/testing/destroySession';

const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};


describe('auth-common', () => {

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

	function insertUserTestDb(done) {
		user = new User();
		user.local.name = USER_NAME;
		user.local.email = USER_EMAIL;
		user.setPassword(USER_PASSWORD);
		user.save()
			.then(usr => {
        user._id = usr._id;
        updateCookiesAndTokens(done); //pass done, it's important!
			})
			.catch(err => {
        done(err);
			});
	}

	function dropUserTestDbAndLogout(done) {
		User.remove({})
			.then(() => {
        //I want to try to logout to be able to run all tests in a clean state
        //If this call returns 4xx or 2xx it's not important here
        getPartialGetRequest(URL_LOGOUT)
          .send()
          .end((err, res) => done(err));
			})
			.catch(err => {
				done(err);
			});
	}

	function getPartialPostRequest (apiUrl) {
		return agent
		.post(apiUrl)
		.set('Content-Type', 'application/json')
		.set('Accept', 'application/json')
		.set('set-cookie', 'connect.sid=' + connectionSid)
		.set('set-cookie', 'XSRF-TOKEN=' + csrftoken);
	}

	//useful function that prevent to copy and paste the same code
	function getPartialGetRequest (apiUrl) {
		return agent
		.get(apiUrl)
		.set('Content-Type', 'application/json')
		.set('Accept', 'application/json');
	}

	describe('#sessionToken()', () => {
		describe('---YES---', () => {

			beforeEach(done => insertUserTestDb(done));

			it('should get session authentication token saved into a redis db', done => {

				async.waterfall([
					asyncDone => {
						getPartialPostRequest(URL_LOGIN)
						.set('XSRF-TOKEN', csrftoken)
						.send(loginMock)
						.expect(200)
						.end((err, res) => asyncDone(err, res));
					},
					(res, asyncDone) => {
						expect(res.body.token).to.be.not.null;
						expect(res.body.token).to.be.not.undefined;

						getPartialGetRequest(URL_SESSIONTOKEN)
						.send()
						.expect(200)
						.end((err, res) => {
							const resp = JSON.parse(res.body);
							expect(resp.token).to.be.not.undefined;
							asyncDone(err);
						});
					}], (err, response) => done(err));
			});

			afterEach(done => dropUserTestDbAndLogout(done));
		});


		describe('---ERRORS---', () => {

			beforeEach(done => insertUserTestDb(done));

			it('should get 403 FORBIDDEN, because you aren\'t authenticated', done => {
				getPartialGetRequest(URL_SESSIONTOKEN)
				//not authenticated
				.send(loginMock)
				.expect(403)
				.end(() => done());
			});

			it('should get 404 NOT FOUND, because session token is not available', done => {
				async.waterfall([
					asyncDone => {
						getPartialPostRequest(URL_LOGIN)
						.set('XSRF-TOKEN', csrftoken)
						.send(loginMock)
						.expect(200)
						.end((err, res) => asyncDone(err, res));
					},
					(res, asyncDone) => {
						expect(res.body.token).to.be.not.null;
						expect(res.body.token).to.be.not.undefined;
						console.log(res.body);

						getPartialGetRequest(URL_DESTROY_SESSION)
						.send()
						.expect(200)
						.end((err, res) => asyncDone(err, res));
					},
					(res, asyncDone) => {
						// BYPASS rest-auth-middleware
						process.env.DISABLE_REST_AUTH_MIDDLEWARE = 'yes';

						getPartialGetRequest(URL_SESSIONTOKEN)
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

			afterEach(done => dropUserTestDbAndLogout(done));
		});
	});

  // after(() => {
  //   mongoose.disconnect();
  // });
});
