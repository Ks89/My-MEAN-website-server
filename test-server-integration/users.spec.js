'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

var expect = require('chai').expect;
var app = require('../app');
var agent = require('supertest').agent(app);
var async = require('async');

require('../src/models/users');
var mongoose = require('mongoose');
var User = mongoose.model('User');

var user;
var csrftoken;
var connectionSid;

const USER_NAME = 'username';
const USER_EMAIL = 'email@email.it';
const USER_PASSWORD = 'Password1';

const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};

const URL_LOGIN = '/api/login';
const URL_LOGOUT = '/api/logout';
const URL_SINGLE_USER = '/api/users/';

describe('users', () => {

	function updateCookiesAndTokens(done) {
		agent
		.get('/login')
		.end((err1, res1) => {
			if(err1) {
				throw "Error while calling login page";
			} else {
				csrftoken = (res1.headers['set-cookie']).filter(value =>{
					return value.includes('XSRF-TOKEN');
				})[0];
				connectionSid = (res1.headers['set-cookie']).filter(value =>{
					return value.includes('connect.sid');
				})[0];
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
		// user.local.activateAccountToken = 'TOKEN';
		// 	user.local.activateAccountExpires =  new Date(Date.now() + 24*3600*1000); // 1 hour
		// 	user.local.resetPasswordToken = 'TOKEN';
		// 	user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour
		user.github.id = '1231232';
		user.github.token = 'TOKEN';
		user.github.email = 'email@email.it';
		user.github.name = 'username';
		user.github.username = 'username';
		user.github.profileUrl = 'http://fakeprofileurl.com/myprofile';
		user.profile = {
				name : 'username',
				surname : 'username',
				nickname : 'username',
				email : 'email@email.it',
				updated : new Date(),
				visible : true
		};
		user.save((err, usr) => {
			if(err) {
				done(err);
			}
			user._id = usr._id;
			updateCookiesAndTokens(done); //pass done, it's important!
		});
	}

	//useful function that prevent to copy and paste the same code
	function getPartialPostRequest (apiUrl) {
		return agent
			.post(apiUrl)
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.set('set-cookie', 'connect.sid=' + connectionSid)
			.set('set-cookie', 'XSRF-TOKEN=' + csrftoken);
	}

	function getPartialGetRequest (apiUrl) {
		return agent
			.get(apiUrl)
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json');
	}

	function dropUserTestDbAndLogout(done) {
		User.remove({}, err => {
			//I want to try to logout to be able to run all tests in a clean state
			//If this call returns 4xx or 2xx it's not important here
			getPartialGetRequest(URL_LOGOUT)
			.send()
			.end((err, res) => done(err));
		});
	}

	describe('---YES---', () => {

		before(done => insertUserTestDb(done));

		it('should correctly get a single user by its id', done => {
			async.waterfall([
				asyncDone => {
					getPartialPostRequest(URL_LOGIN)
					.set('XSRF-TOKEN', csrftoken)
					.send(loginMock)
					.expect(200)
					.end((err, res) => {
						expect(res.body.token).to.be.not.null;
						expect(res.body.token).to.be.not.undefined;
						asyncDone(err);
					});
				},
				asyncDone => {
					getPartialGetRequest(URL_SINGLE_USER + user._id)
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

		after(done => dropUserTestDbAndLogout(done));
	});


	describe('---ERRORS---', () => {
		//here there are some test with empty user, because I destroyed the db
		//in the afterEach above.
		before(done => insertUserTestDb(done));

		it('should catch 404 not found and check the error message', done => {
			async.waterfall([
				asyncDone => {
					getPartialPostRequest(URL_LOGIN)
					.set('XSRF-TOKEN', csrftoken)
					.send(loginMock)
					.expect(200)
					.end((err, res) => {
						expect(res.body.token).to.be.not.null;
						expect(res.body.token).to.be.not.undefined;
						asyncDone(err);
					});
				},
				asyncDone => {
					getPartialGetRequest(URL_SINGLE_USER + 'fakeId')
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

		after(done => dropUserTestDbAndLogout(done));
	});
});
