const config = require('../config');
let logger = require('./logger-winston');
let stubTransport = require('nodemailer-stub-transport');
let nodemailer = require('nodemailer');

class MailUtils {

  static getMailTransport() {
    let mailTransport;
    if (config.isTest()) {
      console.log('mail-util init - TEST ENV! Using mocked mailTransport'); // no logger needed
      mailTransport = nodemailer.createTransport(stubTransport());
    } else {
      logger.debug('mail-util init - Using the real mailTransport');
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
    return mailTransport;
  }
}

module.exports = MailUtils;
