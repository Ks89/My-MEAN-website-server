'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

console.log("Starting with NODE_ENV=" + process.env.NODE_ENV);
console.log("process.env.CI is " + process.env.CI);

if(!process.env.CI) {
  console.log("Initializing dotenv (requires .env file)")
  //to be able to use generateJwt I must import
  //dotenv (otherwise I cannot read process.env with the encryption key)
  require('dotenv').config();
}

let expect = require('chai').expect;
let Promise = require('bluebird');
let mongoose = require('mongoose');
let connectMongoose = Promise.promisify(mongoose.connect, {context: mongoose});
let passport = require('../src/controllers/authentication/passport');
let userId;

require('../src/models/users');
let User = mongoose.model('User');

describe('passport', () => {

  before(done => {
    //Connection ready state: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connections[0] && mongoose.connections[0]._readyState !== 0) {
      console.log("readyState: " + mongoose.connections[0]._readyState);
      console.log("----------------- already connected");
      done();
    } else {
      connectMongoose('mongodb://localhost/test-db', mongoose)
        .then(() => {
          console.log(`----------------- connection created - connections size: ${mongoose.connections.length}`);
          done();
        });
    }
  });

  describe('serializeUser and deserializeUser', () => {

    before(done => {
      let newUser = new User();
      newUser.save()
        .then(savedUser => {
          userId = savedUser._id;
          done();
        }).catch(err => {
          fail('should not throw an error');
          done(err);
        });

    });

    describe('---YES---', () => {

      it('should check if the deserialized is correct', done => {
        // serialize
        // simply call the callback
        function mockedDoneSerialize(){};
        function serialize(user, mockedDoneSerialize) {
          mockedDoneSerialize();
        }

        // deserialize
        // call the callback with a userMock object
        // and check if _id is equals to the _id in my database
        // inserted by the `before` function
        let userMock = { id: '' };
        function mockedDoneDeserialize(err, userMock) {
          expect(userMock._id+"").to.be.equals(userId+"");
        }
        function deserialize(id, mockedDoneDeserialize) {
          mockedDoneDeserialize(null, id);
        }

        // create a passportRefMock (an object with come functions)
        // also `use`, because required by one `require` inside passport.js
        let passportRefMock = {
          serializeUser: function(serialize) { 
            // mocked serializeUser function
            serialize(userMock,mockedDoneSerialize);
          },
          deserializeUser: function(deserialize) { 
            // mocked deserializeUser function
            deserialize(userId,mockedDoneDeserialize);
          },
          use: function(strategy) {
            // mocked use function
          }
        };

        // call passport.js with the mocked infos
        // it will call done functions automatically, in particular
        // mockedDoneSerialize and mockedDoneDeserialize.
        // The first one is useless, but the second will check if the
        // userid in db is equals to the _id in the object, received by the function
        passport(passportRefMock);
        done();
      });

    });
  });

  after(done => {
    console.info("Disconnecting");
    mongoose.disconnect().then(() => {
      console.info(`Disconnected - test finished - connection size: ${mongoose.connections.length}`);
      done();
    });
  });
});
