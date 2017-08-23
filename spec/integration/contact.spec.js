'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

const APIS = require('../../src/routes/apis');

let expect = require('chai').expect;
let app = require('../../app');
let agent = require('supertest').agent(app);

const TestUtils = require('../util/utils');
let testUtils = new TestUtils(agent);

const RECAPTCHA_BASE_URL = 'https://www.google.com/recaptcha';
const RECAPTCHA_API_URL = '/api/siteverify';
const EMAIL_URL = APIS.BASE_API_PATH + APIS.POST_CONTACT_EMAIL;

const RESPONSE = 'random_data';
const EMAIL = 'fake@fake.it';
const OBJECT = 'useless email';
const MESSAGE = 'some random words';

const contactMock = {
	response: RESPONSE,
    emailFormData: {
    	email: EMAIL,
    	object: OBJECT,
    	messageText: MESSAGE
    }
};

const recaptchaCorrectRespMock = {
	success: true,
	challenge_ts: "2016-06-22T22:59:40Z",
	hostname: "localhost"
};

const recaptchaWrong1RespMock = {
	success: false,
	challenge_ts: "2016-06-22T22:59:40Z",
	hostname: "localhost"
};

const recaptchaWrong2RespMock = {
	success: false,
	challenge_ts: "2016-06-22T22:59:40Z",
	hostname: "localhost",
	'error-codes': ['some-error1', 'another-error']
};

describe('contact', () => {

	describe('#sendEmailWithRecaptcha()', () => {

		describe('---YES---', () => {

			beforeEach(done => testUtils.updateCookiesAndTokens(done));

			it('should correctly send an email', done => {
				testUtils.getPartialNockApiUrl(RECAPTCHA_BASE_URL, RECAPTCHA_API_URL).reply(200, recaptchaCorrectRespMock);
        testUtils.getPartialPostRequest(EMAIL_URL)
				.set('XSRF-TOKEN', testUtils.csrftoken)
				.send(contactMock)
				.expect(200)
				.end((err, res) => {
					if (!err) {
						expect(res.body.message).to.be.equals(EMAIL);
					}
					done(err);
				});
			});
		});


		describe('---NO---', () => {

			beforeEach(done => testUtils.updateCookiesAndTokens(done));

			it('should catch a 401 UNAUTHORIZED, because Recaptcha2 answers false', done => {
				testUtils.getPartialNockApiUrl(RECAPTCHA_BASE_URL, RECAPTCHA_API_URL).reply(200, recaptchaWrong1RespMock);
        testUtils.getPartialPostRequest(EMAIL_URL)
				.set('XSRF-TOKEN', testUtils.csrftoken)
				.send(contactMock)
				.expect(401)
				.end((err, res) => {
					if (!err) {
						expect(res.body.message).to.be.equals('Recaptcha verify answered FALSE!');
					}
					done(err);
				});
			});

			it('should catch a 401 UNAUTHORIZED, because Recaptcha2 answers false also with an array of error codes', done => {
				testUtils.getPartialNockApiUrl(RECAPTCHA_BASE_URL, RECAPTCHA_API_URL).reply(200, recaptchaWrong2RespMock);
        testUtils.getPartialPostRequest(EMAIL_URL)
				.set('XSRF-TOKEN', testUtils.csrftoken)
				.send(contactMock)
				.expect(401)
				.end((err, res) => {
					if (!err) {
						expect(res.body.message[0]).to.be.equals('some-error1');
						expect(res.body.message[1]).to.be.equals('another-error');
					}
					done(err);
				});
			});


			const missingEmailFormData = [
				{email: EMAIL, object: OBJECT, messageText: MESSAGE},
				{email: EMAIL, messageText: MESSAGE},
				{email: EMAIL, object: OBJECT},
				{object: OBJECT, messageText: MESSAGE},
				{email: EMAIL},
				{object: OBJECT},
				{messageText: MESSAGE},
				{}
			];
			const missingContactMocks = [
				{response: RESPONSE, emailFormData: missingEmailFormData[0]},
				{response: RESPONSE, emailFormData: missingEmailFormData[1]},
				{response: RESPONSE, emailFormData: missingEmailFormData[2]},
				{response: RESPONSE, emailFormData: missingEmailFormData[3]},
				{response: RESPONSE, emailFormData: missingEmailFormData[4]},
				{response: RESPONSE, emailFormData: missingEmailFormData[5]},
				{response: RESPONSE, emailFormData: missingEmailFormData[6]},
				{response: RESPONSE},
				{}
			];

			//these are multiple tests that I'm expecting for all combinations
			//of missing params
			for(let i = 0; i<missingContactMocks.length; i++) {
				console.log(missingContactMocks[i]);

				it('should catch a 400 BAD REQUEST, because subject, object and text params are mandatory. Test i=' + i, done => {
					testUtils.getPartialNockApiUrl(RECAPTCHA_BASE_URL, RECAPTCHA_API_URL).reply(200, recaptchaCorrectRespMock);

					//remove imput params
					delete contactMock.emailFormData;

          testUtils.getPartialPostRequest(EMAIL_URL)
					.set('XSRF-TOKEN', testUtils.csrftoken)
					.send(contactMock)
					.expect(400)
					.end((err, res) => {
						if (!err) {
							expect(res.body.message).to.be.equals('Missing input params');
						}
						done(err);
					});
				});
			}
		});

		describe('---ERRORS---', () => {
			it('should get 403 FORBIDDEN,, because XSRF-TOKEN is not available', done => {
				testUtils.getPartialPostRequest(EMAIL_URL)
				//XSRF-TOKEN NOT SETTED!!!!
				.send(contactMock)
				.expect(403)
				.end(() => done());
			});
		});
	});
});
