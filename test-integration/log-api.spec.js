'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

const APIS = require('../src/routes/apis');

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

const URL_LOG_DEBUG = APIS.BASE_LOG_API_PATH + APIS.POST_LOG_DEBUG;
const URL_LOG_ERROR = APIS.BASE_LOG_API_PATH + APIS.POST_LOG_ERROR;
const URL_LOG_EXCEPTION = APIS.BASE_LOG_API_PATH + APIS.POST_LOG_EXCEPTION;


describe('log-api', () => {
  describe('---YES---', () => {
    it('should correctly log a debug message', done => {
      testUtils.getPartialPostRequest(URL_LOG_DEBUG)
      .send(bodyMock)
      .expect(200)
      .end((err, res) => {
        expect(res.body.info).to.equal(DEBUG_LOGGED);
        expect(res.body.body.message).to.equal(bodyMock.message);
        done(err);
      });
    });

    it('should correctly log a debug message, also if message is undefined', done => {
      testUtils.getPartialPostRequest(URL_LOG_DEBUG)
      .send(bodyNoMessageMock)
      .expect(200)
      .end((err, res) => {
        expect(res.body.info).to.equal(DEBUG_LOGGED);
        expect(res.body.body.message).to.be.undefined;
        done(err);
      });
    });

    it('should correctly log an error message', done => {
      testUtils.getPartialPostRequest(URL_LOG_ERROR)
      .send(bodyMock)
      .expect(200)
      .end((err, res) => {
        expect(res.body.info).to.equal(ERROR_LOGGED);
        expect(res.body.body.message).to.equal(bodyMock.message);
        done(err);
      });
    });

    it('should correctly log an error message, also if message is undefined', done => {
      testUtils.getPartialPostRequest(URL_LOG_ERROR)
      .send(bodyNoMessageMock)
      .expect(200)
      .end((err, res) => {
        expect(res.body.info).to.equal(ERROR_LOGGED);
        expect(res.body.body.message).to.be.undefined;
        done(err);
      });
    });

    it('should correctly log an exception message', done => {
      testUtils.getPartialPostRequest(URL_LOG_EXCEPTION)
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
