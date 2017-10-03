'use strict';

// --------------------------------------------------------
// ------------------Init env variables--------------------
// --------------------------------------------------------
const config = require('./src/config');
if (process.env.NODE_ENV !== 'production') {
  console.log('config file loaded', config);
}
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------

let logger = require('./src/utils/logger-winston.js');
logger.warn(`Starting with NODE_ENV=${config.NODE_ENV}`);
logger.warn(`config.CI is ${config.CI} and isCI is ${config.isCI()}`);

const APIS = require('./src/routes/apis');

let bluebird = require('bluebird');
let path = require('path');
let express = require('express');
// let vhost = require('vhost');
let compression = require('compression');
let morgan = require('morgan');
let session = require('express-session');
let bodyParser = require('body-parser');

// --------------------------------------------------------
// -----------------------Redis init-----------------------
// --------------------------------------------------------
// Init REDIS (below I add also redis to express session thanks to connect-redis)
let redis = require('redis');
let client = redis.createClient();
let RedisStore = require('connect-redis')(session);
let redisStore = bluebird.promisifyAll(new RedisStore({host: config.REDIS_HOST, port: config.REDIS_PORT, client: client, ttl: config.REDIS_TTL}));
// --------------------------------------------------------
// --------------------------------------------------------
// --------------------------------------------------------


// --------------------------------------------------------
// --------------------------------------------------------
// See this issue here https://github.com/Ks89/My-MEAN-website/issues/30
//  to understand this piece of code.
let pathFrontEndFolder, pathFrontEndIndex;
let pathFrontEndAdminIndex;
if ((config.isCI() || config.isTest()) && !config.isForE2eTest()) {
  console.log(`Executed in CI or TEST - providing fake '../My-MEAN-website-client' and index.html`);
  //provides fake directories and files to be able to run this files
  //also with mocha in both test and ci environments.
  //Otherwise, you are forced to run `npm run build` into ../My-MEAN-website-client's folder
  pathFrontEndFolder = path.join(__dirname);
  pathFrontEndIndex = path.join(__dirname, 'app.js');
} else {
  if (config.isProd()) {
    logger.warn('Providing both index.html and admin.html in a production environment');
    // you can add custom configuration here for production mode
  } else {
    logger.warn(`Providing real ${config.FRONT_END_PATH}, index.html and admin.html`);
  }
  pathFrontEndFolder = path.join(__dirname, config.FRONT_END_PATH);
  pathFrontEndIndex = path.join(__dirname, config.FRONT_END_PATH, 'index.html');
  pathFrontEndAdminIndex = path.join(__dirname, config.FRONT_END_PATH, 'admin.html');
}
// --------------------------------------------------------
// --------------------------------------------------------


// --------------------------------------------------------------------------
// ----------------------------security packages-----------------------------
// --------------------------------------------------------------------------
// All security features are prefixed with `--SEC--`
// --SEC-- - github helmetjs/expect-ct [NOT helmet]
//    The Expect-CT HTTP header tells browsers to expect Certificate Transparency
let expectCt = require('expect-ct');
// --SEC-- - github analog-nico/hpp [NOT helmet]
//    [http params pollution] security package to prevent http params pollution
let hpp = require('hpp');
// --SEC-- - [CSRF] github.com/expressjs/csurf [NOT helmet]
let csrf = require('csurf');
// --SEC-- - authentication local/3dparty (OAuth)
let passport = require('passport');
// --SEC-- - github ericmdantas/express-content-length-validator [NOT helmet]
//    large payload attacks - Make sure this application is
//    not vulnerable to large payload attacks
let contentLength = require('express-content-length-validator');
const MAX_CONTENT_LENGTH_ACCEPTED = 9999; // constants used with `contentLength`
// --SEC-- - Helmet
let helmet = require('helmet');
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------


logger.warn('Initializing mongodb');
//require for mongo
require('./src/models/db');
require('./src/controllers/authentication/passport')(passport);


logger.warn('Initializing expressjs');
let app = express();

logger.warn('Initializing helmet');
// --SEC-- - [helmet] enable helmet
// this automatically add 9 of 11 security features
/*
 -dnsPrefetchControl controls browser DNS prefetching
 -frameguard to prevent clickjacking
 -hidePoweredBy to remove the X-Powered-By header
 -hpkp for HTTP Public Key Pinning
 -hsts for HTTP Strict Transport Security
 -ieNoOpen sets X-Download-Options for IE8+
 -noSniff to keep clients from sniffing the MIME type
 -xssFilter adds some small XSS protections
 */
// The other features NOT included by default are:
/*
 -contentSecurityPolicy for setting Content Security Policy
 -noCache to disable client-side caching => I don't want this for better performances
 -referrerPolicy to hide the Referer header
 */
app.use(helmet());

// --SEC-- - hidePoweredBy: X-Powered-By forced to a fake value to
// hide the default 'express' value [helmet]
app.use(helmet.hidePoweredBy({setTo: config.HELMET_HIDE_POWERED_BY}));

// --SEC-- - noCache to disable client-side caching [helmet]
// I don't want this for better performances (leave commented :))
// app.use(helmet.noCache())

// --SEC-- - referrer-policy to hide the Referer header [helmet]
app.use(helmet.referrerPolicy({policy: config.HELMET_REFERRER_POLICY}));

// --SEC-- - Public Key Pinning (hpkp): HTTPS certificates can be forged,
//    allowing man-in-the middle attacks.
//    HTTP Public Key Pinning aims to help that. [helmet]
const ninetyDaysInSeconds = 7776000;
app.use(helmet.hpkp({
  maxAge: ninetyDaysInSeconds,
  sha256s: [config.HELMET_HPKP_SHA256S_1, config.HELMET_HPKP_SHA256S_2],
  includeSubdomains: true,         // optional
  reportUri: config.HELMET_HPKP_REPORT_URI, // optional
  reportOnly: false,               // optional
  // Set the header based on a condition.
  setIf: req => req.secure //optional ()
}));

// --SEC-- - Content Security Policy (CSP): Trying to prevent Injecting anything
//    unintended into our page. That could cause XSS vulnerabilities,
//    unintended tracking, malicious frames, and more. [helmet]
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: [`'self'`, 'localhost:3000', 'localhost:3001', 'www.google.com', 'www.youtube.com'],
    scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`, 'maxcdn.bootstrapcdn.com',
      'ajax.googleapis.com', 'cdnjs.cloudflare.com',
      'code.jquery.com', 'www.google.com',
      'www.gstatic.com'],
    styleSrc: [`'self'`, 'ajax.googleapis.com', 'maxcdn.bootstrapcdn.com', 'cdnjs.cloudflare.com', `'unsafe-inline'`],
    fontSrc: [`'self'`, 'maxcdn.bootstrapcdn.com'],
    imgSrc: [`'self'`, 'localhost:3000', 'localhost:3001',
      'placehold.it', 'placeholdit.imgix.net', 'camo.githubusercontent.com',
      's3.amazonaws.com', 'cdnjs.cloudflare.com'],
    sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin', 'allow-popups'],
    frameSrc: [`'self'`, 'www.google.com', 'www.youtube.com'], //frame-src is deprecated
    childSrc: [`'self'`, 'www.google.com', 'www.youtube.com'],
    connectSrc: [
      `'self'`, 'cdnjs.cloudflare.com', 'ajax.googleapis.com',
      'ws://localhost:3000', 'ws://localhost:3001', 'ws://localhost:3100',
      'ws://localhost:3300'
    ],
    reportUri: '/report-violation',
    objectSrc: [`'none'`]
  },
  // Set to true if you only want browsers to report errors, not block them
  reportOnly: false,
  // Set to true if you want to blindly set all headers: Content-Security-Policy,
  // X-WebKit-CSP, and X-Content-Security-Policy.
  setAllHeaders: false,
  // Set to true if you want to disable CSP on Android where it can be buggy.
  disableAndroid: false,
  // Set to false if you want to completely disable any user-agent sniffing.
  // This may make the headers less compatible but it will be much faster.
  // This defaults to 'true'.
  browserSniff: true
}));

// --SEC-- - large payload attacks:
//   this line enables the middleware for all routes [NOT helmet]
app.use(contentLength.validateMax({
  max: MAX_CONTENT_LENGTH_ACCEPTED,
  status: 400, message: config.LARGE_PAYLOAD_MESSAGE
})); // max size accepted for the content-length

// --SEC-- - expect-ct
//  https://scotthelme.co.uk/a-new-security-header-expect-ct/
app.use(expectCt({
  enforce: true,
  maxAge: 30,
  reportUri: config.HELMET_EXPECT_CT_REPORT_URI
}));

logger.warn(`Initializing morgan (logger of req, res and so on... It's different from winston logger)`);
if (!config.isCI() && !config.isTest()) {
  // Disable morgan while testing to prevent very big log with useless information
  app.use(morgan('combined', {'stream': logger.stream}));
}

logger.warn('Initializing static resources');
app.use(express.static(pathFrontEndFolder));

logger.warn('Initializing bodyparser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

logger.warn('Initializing hpp');
// --SEC-- - http params pollution: activate http parameters pollution
// use this ALWAYS AFTER app.use(bodyParser.urlencoded()) [NOT helmet]
app.use(hpp());

logger.warn('Initializing Express session');
// Express Session
app.use(session({
  secret: config.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: redisStore
  // cookie: {
  //   httpOnly: false,
  //     secure: false, //to use true, you must use https. If you'll use true with http it won't work.
  //     //maxAge: 2160000000
  // }
}));

logger.warn('Initializing passportjs');

app.use(passport.initialize());
app.use(passport.session());

// compress all requests using gzip
app.use(compression());

logger.warn('Initializing REST apis and CSRF');

// --------------------------------------- ROUTES ---------------------------------------
// dedicated routes for angular logging with stacktracejs
// these router aren't protected with csrf, because declared before app.use(csrf()).
let loggerApi = require('./src/routes/log-api')(express);
app.use(APIS.BASE_LOG_API_PATH, loggerApi);

// enable middleware CSRF by csurf package [NOT helmet]
// before app.use(APIS.BASE_API_PATH, routesApi); to protect their,
// but after session and/or cookie initialization
app.use(csrf());
app.use(function (req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  res.locals.csrftoken = req.csrfToken();
  next();
});

// APIs for all route protected with CSRF (all routes except for angular log's service)
let routesApi = require('./src/routes/index')(express);
app.use(APIS.BASE_API_PATH, routesApi);
// --------------------------------------------------------------------------------------

logger.warn('Initializing static path for both index.html and admin.html');

app.use('/', function (req, res) {
  res.sendFile(pathFrontEndIndex);
});

app.use('/admin', function (req, res) {
  res.sendFile(pathFrontEndAdminIndex);
});

// app.use(vhost('mymeanwebsite.it', function (req, res) {
//   res.sendFile(pathFrontEndIndex);
// }));
//
// app.use(vhost('admin.mymeanwebsite.it', function (req, res) {
//   res.sendFile(pathFrontEndAdminIndex);
// }));


// catch bad csrf token
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  // handle CSRF token errors here
  res.status(403);
  res.json({ message: 'session has expired or form tampered with'});
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// Catch unauthorised errors
app.use(function (err, req, res) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({ message: `${err.name}: ${err.message}`});
  }
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;