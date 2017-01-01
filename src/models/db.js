var mongoose = require( 'mongoose' );
// var logger = require('../utils/logger.js');

var gracefulShutdown;
var dbURI = 'mongodb://localhost/KS';

// ------------------------
// as explained here http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird');
// ------------------------

if (process.env.NODE_ENV === 'production') {
	console.log("production mode enabled!");
	dbURI = process.env.MONGOLAB_URI; //you can set this using heroku config:set MONGOLAB_URI=path
} else if (process.env.NODE_ENV === 'test') {
	console.log("testing mode enabled!");
	dbURI = 'mongodb://localhost/test-db';
}

mongoose.connection.on('connecting', () => {
  console.log(`[Mongoose status] Mongoose is connecting to ${dbURI}`);
});
mongoose.connection.on('connected', () => {
  console.log(`[Mongoose status] Mongoose connected to ${dbURI}`);
});
mongoose.connection.on('error', err => {
  console.error(`[Mongoose status] Mongoose connection error: ${err}`);
});
mongoose.connection.on('close', () => {
  console.warn('[Mongoose status] Mongoose connection closed');
});
mongoose.connection.on('reconnected', () => {
  console.warn('[Mongoose status] Mongoose reconnected');
});
mongoose.connection.on('disconnected', () => {
  console.log('[Mongoose status] Mongoose disconnected');
});

mongoose.connect(dbURI, err => {
	// found here http://mongoosejs.com/docs/api.html#index_Mongoose-connect
	if(err) {
    console.log('Mongoose connection - error: ' + err);
	} else {
    console.log('Mongoose connect called successfully');
	}
});

gracefulShutdown = function (msg, callback) {
	mongoose.disconnect(() => {
		console.log(`Mongoose disconnected through ${msg}`);
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