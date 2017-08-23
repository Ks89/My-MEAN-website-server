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

const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};

const URL_PROFILE = APIS.BASE_API_PATH + APIS.POST_PROFILE;
const URL_LOGIN = APIS.BASE_API_PATH + APIS.POST_LOCAL_LOGIN;

describe('profile', () => {

	describe('#login()', () => {
		describe('---YES---', () => {

			beforeEach(done => testUsersUtils.insertUserWithProfileTestDb(done));

			it('should correctly update the profile by github id', done => {

			  let user;

				async.waterfall([
          asyncDone => {
            testUsersUtils.readUserLocalByEmailLocal(asyncDone);
          },
          (userDb, asyncDone) => {
				    user = userDb;
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
            const mockedProfilePost = {
              localUserEmail: user.local.email,
              id: "", //only for 3dauth
              serviceName: "local",
              name: user.profile.name,
              surname: user.profile.surname,
              nickname: user.profile.nickname,
              email: user.profile.email
            };

						testUtils.getPartialPostRequest(URL_PROFILE)
						.set('XSRF-TOKEN', testUtils.csrftoken)
						.send(mockedProfilePost)
						.expect(200)
						.end((err, res) => {
							expect(res.body.message).to.be.equals("Profile updated successfully!");
							asyncDone(err);
						});
					},
					asyncDone => {
            User.findOne({ 'local.email': USER_EMAIL })
              .then(usr => {
                expect(usr.local.name).to.be.equals(user.local.name);
                expect(usr.local.email).to.be.equals(user.local.email);
                expect(usr.validPassword(USER_PASSWORD));
                expect(usr.profile.name).to.be.equals(user.profile.name);
                expect(usr.profile.surname).to.be.equals(user.profile.surname);
                expect(usr.profile.nickname).to.be.equals(user.profile.nickname);
                expect(usr.profile.email).to.be.equals(user.profile.email);
                //expect(usr.profile.updated).to.be.equals(user.profile.updated);
                expect(usr.profile.visible).to.be.equals(user.profile.visible);
                asyncDone();
              })
              .catch(err => {
                asyncDone(err);
              });
					}
				], (err, response) => done(err));
			});

			afterEach(done => testUsersUtils.dropUserTestDb(done));
		});

		describe('---NO - Missing params or not accepted combination of them---', () => {

			before(done => testUsersUtils.insertUserWithProfileTestDb(done));

			const missingServiceNameParams = [
				{localUserEmail: 'fake_email', name:'a',surname:'b',nickname:'c',email:'d'},
				{localUserEmail: 'fake_email', id: 'fake_id', name:'a',surname:'b',nickname:'c',email:'d'},
				{}
			];
			const missingLocalParams = [
				{id: 'fake_id', serviceName: "local", name:'a',surname:'b',nickname:'c',email:'d'},
				{serviceName: "local", name:'a',surname:'b',nickname:'c',email:'d'}
			];
			const missing3dAuthParams = [
				{localUserEmail: 'fake_email', serviceName: "github", name:'a',surname:'b',nickname:'c',email:'d'},
				{localUserEmail: 'fake_email', serviceName: "github", name:'a'}
			];
			const missingProfileParams = [
				{localUserEmail: 'fake_email', serviceName: "local", name:'a',surname:'b',email:'d'},
				{localUserEmail: 'fake_email', serviceName: "local", id: 'fake_id', email:'d'},
				{id: 'fake_id', serviceName: "github",surname:'b',nickname:'c',email:'d'},
				{id: 'fake_id', serviceName: "github", name:'a',surname:'b',nickname:'c'},
				{localUserEmail: 'fake_email', serviceName: "local", id:'fake_id', name:'a',surname:'b'},
				{serviceName: "github", id:'fake_id'}
			];

			const testAggregator = [
				{test: missingServiceNameParams, resultMsg: 'serviceName is required'},
				{test: missingLocalParams, resultMsg: 'localUserEmail is required if you pass serviceName = local'},
				{test: missing3dAuthParams, resultMsg: 'id is required if you pass serviceName != local'},
				{test: missingProfileParams, resultMsg: 'All profile params are mandatory'}
			];

			//these are multiple tests that I'm execting for all cobinations of wrong params
			//(two fors because testAggregator contains test with the real array of tests)
			for(let i = 0; i<testAggregator.length; i++) {
				for(let j = 0; j<testAggregator[i].test.length; j++) {
					console.log(testAggregator[i].test[j]);
					it('should get 400 BAD REQUEST,' + testAggregator[i].resultMsg + '. Test i=' + i + ', j=' + j, done => {
						testUtils.getPartialPostRequest(URL_PROFILE)
						.set('XSRF-TOKEN', testUtils.csrftoken)
						.send(testAggregator[i].test[j])
						.expect(400)
						.end((err, res) => {
							if (err) {
								return done(err);
							} else {
								console.log(res.body);
								expect(res.body.message).to.be.equals(testAggregator[i].resultMsg);
								done();
							}
						});
					});
				}
			}

			after(done => testUsersUtils.dropUserTestDb(done));

		});


		describe('---NO - Wrong params---', () => {

			before(done => testUsersUtils.insertUserWithProfileTestDb(done));

			const wrongLocalProfileMock = {
				localUserEmail: 'WRONG_EMAIL',
				serviceName: "local",
				name: "random_name",
				surname: "random_surname",
				nickname: "random_nickname",
				email: "random_email"
			};

			const wrong3dAuthProfileMock = {
				id: 'WRONG_ID',
				serviceName: "github",
				name: "random_name",
				surname: "random_surname",
				nickname: "random_nickname",
				email: "random_email"
			};

			const wrongParamProfileUpdate = [ wrongLocalProfileMock, wrong3dAuthProfileMock ];

			//these are multiple tests that I'm execting for all cobinations
			//of wrong params
			for(let i = 0; i<wrongParamProfileUpdate.length; i++) {
				console.log(wrongParamProfileUpdate[i]);
				it('should get 404 NOT FOUND, because you must pass correct the email/id', done => {
					testUtils.getPartialPostRequest(URL_PROFILE)
					.set('XSRF-TOKEN', testUtils.csrftoken)
					.send(wrongParamProfileUpdate[i])
					.expect(404)
					.end((err, res) => {
						if (err) {
							return done(err);
						} else {
							console.log(res.body);
							expect(res.body.message).to.be.equals('Error while updating your profile. Please retry.');
							done();
						}
					});
				});
			}

			after(done => testUsersUtils.dropUserTestDb(done));

		});
	});


	describe('---ERRORS---', () => {
		it('should get 403 FORBIDDEN, because XSRF-TOKEN is not available', done => {
			testUtils.getPartialPostRequest(URL_PROFILE)
			//XSRF-TOKEN NOT SETTED!!!!
			.send({}) //It's not necessary to pass real data here
			.expect(403)
			.end(() => done());
		});
	});
});
