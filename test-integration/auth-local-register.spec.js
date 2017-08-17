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

let NEW_NAME = 'Fake name';
let NEW_EMAIL = 'fake@email.com';
let NEW_PASSWORD = 'Password2';

const registerMock = {
	name: NEW_NAME,
	email : NEW_EMAIL,
	password : NEW_PASSWORD
};

describe('auth-local', () => {

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
		user.local.name = NEW_NAME;
		user.local.email = NEW_EMAIL;
		user.setPassword(NEW_PASSWORD);
		user.save()
			.then(usr => {
        user._id = usr._id;
        updateCookiesAndTokens(done); //pass done, it's important!
			})
			.catch(err => {
        done(err);
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

	function dropUserCollectionTestDb(done) {
    User.remove({})
      .then(() => {
        done();
      }).catch(err => {
        fail('should not throw an error');
        done(err);
      });
	}

	describe('#register()', () => {

		beforeEach(done => dropUserCollectionTestDb(done));

		describe('---YES---', () => {

			beforeEach(done => updateCookiesAndTokens(done));

			it('should correctly register a new user', done => {
	    		getPartialPostRequest('/api/register')
				.set('XSRF-TOKEN', csrftoken)
				.send(registerMock)
				.expect(200)
				.end((err, res) => {
					if (err) {
						return done(err);
					} else {
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
              .catch(err1 => {
                done(err1);
              });
					}
				});
			});

			afterEach(done => dropUserCollectionTestDb(done));
		});

		describe('---NO---', () => {
			beforeEach(done => updateCookiesAndTokens(done));

			it('should get 400 BAD REQUEST, because user already exists', done => {
				async.waterfall([
					asyncDone => insertUserTestDb(asyncDone),
					asyncDone => {
						getPartialPostRequest('/api/register')
						.set('XSRF-TOKEN', csrftoken)
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
						done(err);
					} else {
						expect(res.body.message).to.be.equals("User already exists. Try to login.");
						done();
					}
				});
			});

			afterEach(done => dropUserCollectionTestDb(done));
		});


		describe('---NO - Wrong/Missing params---', () => {
			beforeEach(done => updateCookiesAndTokens(done));

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
        beforeEach(done => updateCookiesAndTokens(done));

        it('should get 400 BAD REQUEST, because you must pass all mandatory params. Test i= ' + i, done => {

					async.waterfall([
						asyncDone => insertUserTestDb(asyncDone),
						asyncDone => {
							getPartialPostRequest('/api/register')
							.set('XSRF-TOKEN', csrftoken)
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
							done(err);
						} else {
							expect(response.message).to.be.equals("All fields required");
							done();
						}
					});

				});
        afterEach(done => dropUserCollectionTestDb(done));
      }

			afterEach(done => dropUserCollectionTestDb(done));
		});

		describe('---ERRORS---', () => {
			it('should get 403 FORBIDDEN, because XSRF-TOKEN is not available', done => {
				getPartialPostRequest('/api/register')
				//XSRF-TOKEN NOT SETTED!!!!
				.send(registerMock)
				.expect(403)
				.end(() => done());
			});
		});
	});

  // after(() => {
  //   mongoose.disconnect();
  // });
});
