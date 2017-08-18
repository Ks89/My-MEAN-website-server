'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

let expect = require('chai').expect;
let app = require('../app');
let agent = require('supertest').agent(app);

const TestUtils = require('../test-util/utils');
let testUtils = new TestUtils(agent);

const DEBUG_LOGGED = "debug logged on server";
const ERROR_LOGGED = "error logged on server";
const EXCEPTION_LOGGED = "Exception logged on server";

const bodyMock = { "message" : "message to log" };
const bodyNoMessageMock = { "something": "something useless" }; // no "message" field
const bodyExceptionMock = {
  errorUrl: "http://localhost/fake url",
  errorMessage: "dsadasdasd",
  cause: ( "cause" || "" )
};

describe('log-api', () => {
  describe('---YES---', () => {
    it('should correctly log a debug message', done => {
      testUtils.getPartialPostRequest('/api/log/debug')
      .send(bodyMock)
      .expect(200)
      .end((err, res) => {
        expect(res.body.info).to.equal(DEBUG_LOGGED);
        expect(res.body.body.message).to.equal(bodyMock.message);
        done(err);
      });
    });

    it('should correctly log a debug message, also if message is undefined', done => {
      testUtils.getPartialPostRequest('/api/log/debug')
      .send(bodyNoMessageMock)
      .expect(200)
      .end((err, res) => {
        expect(res.body.info).to.equal(DEBUG_LOGGED);
        expect(res.body.body.message).to.be.undefined;
        done(err);
      });
    });

    it('should correctly log an error message', done => {
      testUtils.getPartialPostRequest('/api/log/error')
      .send(bodyMock)
      .expect(200)
      .end((err, res) => {
        expect(res.body.info).to.equal(ERROR_LOGGED);
        expect(res.body.body.message).to.equal(bodyMock.message);
        done(err);
      });
    });

    it('should correctly log an error message, also if message is undefined', done => {
      testUtils.getPartialPostRequest('/api/log/error')
      .send(bodyNoMessageMock)
      .expect(200)
      .end((err, res) => {
        expect(res.body.info).to.equal(ERROR_LOGGED);
        expect(res.body.body.message).to.be.undefined;
        done(err);
      });
    });

    it('should correctly log an exception message', done => {
      testUtils.getPartialPostRequest('/api/log/exception')
      .send(bodyExceptionMock)
      .expect(200)
      .end((err, res) => {
        expect(res.body.info).to.equal(EXCEPTION_LOGGED);
        expect(res.body.body.errorUrl).to.equal(bodyExceptionMock.errorUrl);
        expect(res.body.body.errorMessage).to.equal(bodyExceptionMock.errorMessage);
        expect(res.body.body.cause).to.equal(bodyExceptionMock.cause);
        done(err);
      });
    });
  });
});
