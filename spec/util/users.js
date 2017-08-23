'use strict';

const APIS = require('../../src/routes/apis');

require('../../src/models/users');
let mongoose = require('mongoose');
// ------------------------
// as explained here http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird');
// ------------------------
let User = mongoose.model('User');

const URL_LOGOUT = APIS.BASE_API_PATH + APIS.GET_LOGOUT;

const USER_NAME = 'username';
const USER_EMAIL = 'email@email.it';
const USER_PASSWORD = 'Password1';

class TestUsersUtils {

  constructor(testUtils) {
    this._testUtils = testUtils;
  }

  readUserLocalByEmailLocal(done, email = USER_EMAIL) {
    User.findOne({ 'local.email': email })
      .then(usr => {
        done(null, usr);
      }).catch(err => {
        done(err);
      });
  }

  insertUserTestDb(done, username = USER_NAME, email = USER_EMAIL, password = USER_PASSWORD) {
    let user = new User();
    user.local.name = username;
    user.local.email = email;
    user.setPassword(password);
    user.save()
      .then(savedUser => {
        user._id = savedUser._id;
        this._testUtils.updateCookiesAndTokens(done); //pass done, it's important!
      })
      .catch(err => {
        done(err);
      });
  }

  insertUserWithProfileTestDb(done) {
    let user = new User();
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
    user.save()
      .then(usr => {
        user._id = usr._id;
        this._testUtils.updateCookiesAndTokens(done); //pass done, it's important!
      }).catch(err => {
        done(err);
      });
  }

  dropUserTestDb(done) {
    User.remove({})
      .then(() => {
        done();
      }).catch(err => {
        fail('should not throw an error');
        done(err);
      });
  }

  dropUserTestDbAndLogout(done) {
    User.remove({})
      .then(() => {
        //I want to try to logout to be able to run all tests in a clean state
        //If this call returns 4xx or 2xx it's not important here
        this._testUtils.getPartialGetRequest(URL_LOGOUT)
          .send()
          .end((err, res) => done(err));
      }).catch(err => {
        fail('should not throw an error');
        done(err);
      });
  }
}

module.exports = TestUsersUtils;
