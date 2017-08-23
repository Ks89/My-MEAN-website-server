'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

const APIS = require('../../src/routes/apis');

let expect = require('chai').expect;
let app = require('../../app');
let agent = require('supertest').agent(app);
let async = require('async');

const TestUtils = require('../util/utils');
let testUtils = new TestUtils(agent);

const TestUsersUtils = require('../util/users');
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

const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};

const URL_LOGIN = APIS.BASE_API_PATH + APIS.POST_LOCAL_LOGIN;
const URL_SINGLE_USER = APIS.BASE_API_PATH + APIS.GET_TESTING_USERS + '/';  // I'll add here the path param below

describe('users', () => {

	describe('---YES---', () => {

		before(done => testUsersUtils.insertUserWithProfileTestDb(done));

		it('should correctly get a single user by its id', done => {
			async.waterfall([
				asyncDone => {
					testUtils.getPartialPostRequest(URL_LOGIN)
					.set('XSRF-TOKEN', testUtils.csrftoken)
					.send(loginMock)
					.expect(200)
					.end((err, res) => {
						expect(res.body.token).to.be.not.null;
						expect(res.body.token).to.be.not.undefined;
						asyncDone(err);
					});
				},
        asyncDone => {
			    testUsersUtils.readUserLocalByEmailLocal(asyncDone);
        },
        (user, asyncDone) => {
					testUtils.getPartialGetRequest(URL_SINGLE_USER + user._id)
            .expect(200)
            .end((err, res) => {
              let usr = res.body;
              expect(usr).to.be.not.null;
              expect(usr).to.be.not.undefined;

              expect(usr.local.name).to.be.equals(user.local.name);
              expect(usr.local.email).to.be.equals(user.local.email);
              expect(usr.local.hash).to.be.equals(user.local.hash);
              // expect(usr.local.activateAccountToken).to.be.equals(user.local.activateAccountToken);
              //    expect(usr.local.activateAccountExpires).to.be.equals(user.local.activateAccountExpires);
              // expect(usr.local.resetPasswordToken).to.be.equals(user.local.resetPasswordToken);
              //    expect(usr.local.resetPasswordExpires).to.be.equals(user.local.resetPasswordExpires);
              expect(usr.github.id).to.be.equals(user.github.id);
              expect(usr.github.token).to.be.equals(user.github.token);
              expect(usr.github.email).to.be.equals(user.github.email);
              expect(usr.github.name).to.be.equals(user.github.name);
              expect(usr.github.username).to.be.equals(user.github.username);
              expect(usr.github.profileUrl).to.be.equals(user.github.profileUrl);
              expect(usr.profile.name).to.be.equals(user.profile.name);
              expect(usr.profile.surname).to.be.equals(user.profile.surname);
              expect(usr.profile.nickname).to.be.equals(user.profile.nickname);
              expect(usr.profile.email).to.be.equals(user.profile.email);
              // expect(usr.profile.updated).to.be.equals(user.profile.updated);
              expect(usr.profile.visible).to.be.equals(user.profile.visible);
              asyncDone(err);
					  });
				}
			], (err, response) => done(err));
		});

		after(done => testUsersUtils.dropUserTestDbAndLogout(done));
	});


	describe('---ERRORS---', () => {
		//here there are some test with empty user, because I destroyed the db
		//in the afterEach above.
		before(done => testUsersUtils.insertUserWithProfileTestDb(done));

		it('should catch 404 not found and check the error message', done => {
			async.waterfall([
				asyncDone => {
					testUtils.getPartialPostRequest(URL_LOGIN)
					.set('XSRF-TOKEN', testUtils.csrftoken)
					.send(loginMock)
					.expect(200)
					.end((err, res) => {
						expect(res.body.token).to.be.not.null;
						expect(res.body.token).to.be.not.undefined;
						asyncDone(err);
					});
				},
				asyncDone => {
					testUtils.getPartialGetRequest(URL_SINGLE_USER + 'fakeId')
					.expect(404)
					.end((err, res) => {
						// expect(res.body).to.be.not.null;
						// expect(res.body).to.be.not.undefined;
						expect(res.body.message).to.be.equals('User not found');
						asyncDone(err);
					});
				}
			], (err, response) => done(err));
		});

		after(done => testUsersUtils.dropUserTestDbAndLogout(done));
	});
});
