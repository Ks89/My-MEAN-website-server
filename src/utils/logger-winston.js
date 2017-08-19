'use strict';

// You cannot use config.js here!!!

let winston = require('winston');
winston.emitErrs = true;

function getFormatter(options) {
  // Return string will be passed to logger.
  return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' +
    (undefined !== options.message ? options.message : '') +
    (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '' );
}

let logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      filename: 'mywebsite.log',
      handleExceptions: true,
      json: false,
      //maxsize: 5242880, //5MB
      //maxFiles: 5,
      colorize: false,
      timestamp: () => Date.now(),
      formatter: options => getFormatter(options)
    }),
    new (winston.transports.Console)({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
      timestamp: () => Date.now(),
      formatter: options => getFormatter(options)
    })
  ],
  exitOnError: false
});

module.exports = logger;

module.exports.stream = {
  write: (message) => {
    logger.info(message);
  }
};
