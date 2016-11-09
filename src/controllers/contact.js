var stubTransport = require('nodemailer-stub-transport');
var nodemailer = require('nodemailer');
var url = require('url');
var request = require('request');
var logger = require('../utils/logger.js');
var Utils = require('../utils/util');
var async = require('async');


if(process.env.NODE_ENV === 'test') {
	mailTransport = nodemailer.createTransport(stubTransport());
} else {
	mailTransport = nodemailer.createTransport({
		host: 'mail.stefanocappa.it',
		port: '25',
		debug: true, //this!!!
		auth: {
			user: process.env.USER_EMAIL, //secret data
			pass: process.env.PASS_EMAIL //secret data
		}
	});
}

/**
* @api {post} /api/email Send an email to the administrator.
* @apiVersion 0.0.1
* @apiName PostContact
* @apiGroup Contact
* @apiPermission none
*
* @apiDescription Send an email to the administrator with a text message.
*
* @apiParam {String} response Text with the response received by Google Recaptcha2.
* @apiParam {Object} emailFormData Object with email, object and message texts.
* @apiParam {String} emailFormData.email Text with the sender email.
* @apiParam {String} emailFormData.messageText Text message.
* @apiParam {String} emailFormData.object Text with the email subject (title).
*
* @apiHeaderExample {json} Header-Example:
*     {
*       "Content-Type": "application/json",
*				"XSRF-TOKEN": "A VALID TOKEN"
*     }
*
* @apiSuccess {String} message Text that contains the same emailMessage passed into the request's body.
*
* @apiError RecaptchaError 401 Unknown recaptcha error. It returns recaptcha's response.
* @apiError RecaptchaVerifyError 401 Recaptcha error while verifying. It returns 'Recaptcha verify answered FALSE!'.
* @apiError MissingParamsError 400 It returns 'Missing input params'.
* @apiError EmailSendError 404 It returns null (the value null, not a text).
* @apiError ImpossibleSendError 500 It returns 'Impossibile to send the email'.
* @apiError UnknownError 500 It returns 'Unknown error'.
*
* @apiParamExample {json} Request-Example:
*     {
*       "response": "fsdfsdfsdfsd-response-dasdfasdas",
*       "emailFormData": {
*         "email": "email@emai.it",
*         "messageText": "email message",
*         "object": "email title"
*       }
*     }
*
* @apiSuccessExample {json} Success-Response:
*   HTTP/1.1 200 OK
*   {
*     "message": "email@emai.it"
*   }
*/
module.exports.sendEmailWithRecaptcha = function(req, res) {
	console.log("verifyCaptcha api called in app-api controllers " +req.body.response);

	//complete the request with my secret key
	//as described in google documentation.
	var data = {
		secret: process.env.RECAPTCHA_SECRET,
		response: req.body.response
		//here I can add also the IP, but it's not mandatory
	};

	const RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';

	async.waterfall([
    done => {
    	request.post({url:RECAPTCHA_URL, form: data}, (err,response,body) => {
    		console.log(body);
    		done(err, body);
    	});
    },
    (body, done) => {

	    var result = JSON.parse( body );
			console.log(result);
			if(result.success === false) {
				if(result['error-codes']) {
					Utils.sendJSONres(res, 401, result['error-codes']);
				} else {
					Utils.sendJSONres(res, 401, "Recaptcha verify answered FALSE!");
				}
			} else {
				done();
			}
		},
		(done) => {

			console.log("Trying to send an email");
			if (req.body.emailFormData && req.body.emailFormData.email &&
				req.body.emailFormData.object && req.body.emailFormData.messageText) {

				console.log("Preparing to send an email");
				done(null, req.body.emailFormData);
			} else {
				Utils.sendJSONres(res, 400, 'Missing input params');
			}
		},
		(formEmail, done) => {

			console.log('Sending an email from ' + process.env.USER_EMAIL + ' to: ' + formEmail.email);

			var message = {
				from: process.env.USER_EMAIL,
				to: formEmail.email,
				subject: formEmail.object,
				html: formEmail.messageText,
				generateTextFromHtml: true
			};

			mailTransport.sendMail(message, err => {
				if (err) {
					console.log('err ----> returning 404');
					console.log(err.message);
					done(err, 404, null);
				}
				console.log('OK -----> returning 200');
				done(null, 200, formEmail);
			});
		},
		(resultHttpCode, formEmail, done) => {
			console.log("resultHttpCode: " + resultHttpCode);
			if(resultHttpCode === 200) {
				console.log('Message sent successfully to: ' + formEmail.email);
				Utils.sendJSONres(res, 200, { message: formEmail.email });
			} else {
				console.log("Error, resultHttpCode!=200 -> " + resultHttpCode);
				Utils.sendJSONres(res, 500, "Impossibile to send the email");
			}
	  }], (err) => {
	    if (err) {
	    	Utils.sendJSONres(res, 500, "Unknown error");
			}
    });
};
