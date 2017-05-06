'use strict';

const config = require('../config');
let mongoose = require('mongoose');
let logger = require('../utils/logger-winston');

let dbURI = process.env.MONGODB_URI;
logger.debug(`db - Mongodb uri = ${dbURI}`);

// ------------------------
// as explained here http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird');
// ------------------------

if (config.isTest()) {
  //No logger for testing
  console.log('db - TEST ENV! testing mode enabled!');
  dbURI = 'mongodb://localhost/test-db';
  console.log(`db - TEST ENV! override Mongodb uri = ${dbURI}`);
}

mongoose.connection.on('connecting', () => logger.debug(`db - [Mongoose status] Mongoose is connecting to ${dbURI}`));
mongoose.connection.on('connected', () => logger.debug(`db - [Mongoose status] Mongoose connected to ${dbURI}`));
mongoose.connection.on('error', err => logger.error(`db - [Mongoose status] Mongoose connection error: ${err}`));
mongoose.connection.on('close', () => logger.warn('db - [Mongoose status] Mongoose connection closed'));
mongoose.connection.on('reconnected', () => logger.warn('db - [Mongoose status] Mongoose reconnected'));
mongoose.connection.on('disconnected', () => logger.debug('db - [Mongoose status] Mongoose disconnected'));

mongoose.connect(dbURI, err => {
  // found here http://mongoosejs.com/docs/api.html#index_Mongoose-connect
  if (err) {
    logger.error('db - Mongoose connection', err);
  } else {
    logger.debug('db - Mongoose connect called successfully');
  }
});

let gracefulShutdown = function (msg, callback) {
  mongoose.disconnect(() => {
    logger.debug(`db - Mongoose disconnected through ${msg}`);
    callback();
  });
};

// For nodemon restarts
process.once('SIGUSR2', () => {
  gracefulShutdown('nodemon restart', () => {
    process.kill(process.pid, 'SIGUSR2');
  });
});
// For app termination
process.on('SIGINT', () => {
  gracefulShutdown('app termination', () => {
    process.exit(0);
  });
});
// For Heroku app termination
process.on('SIGTERM', () => {
  gracefulShutdown('Heroku app shutdown', () => {
    process.exit(0);
  });
});

//at the end of this file
require('./users');
require('./projects');