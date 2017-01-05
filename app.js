console.log("Starting with NODE_ENV=" + process.env.NODE_ENV);
console.log("process.env.CI is " + process.env.CI);

if(!process.env.CI) {
  console.log("Initializing dotenv (requires .env file)");
  if(process.env.NODE_ENV === 'prod') {
    // production
    require('dotenv').config({path: '.env_prod'}); //to read info from .env_prod file
  } else {
    // development
    require('dotenv').config({path: '.env'}); //to read info from .env file
  }
}

// ------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------
// re-assign all process.env variables to be used in app.js and defined with dotenv to constants
// In this way I can see all variables defined with donenv and used here
// In CI I can't use dotenv => I provide default values for all these constants
const _FRONT_END_PATH         = process.env.FRONT_END_PATH         || '../My-MEAN-website-client/dist';
const _LARGE_PAYLOAD_MESSAGE  = process.env.LARGE_PAYLOAD_MESSAGE  || 'stop it!';
const _EXPRESS_SESSION_SECRET = process.env.EXPRESS_SESSION_SECRET || 'keyboard cat';
const _HELMET_HIDE_POWERED_BY = process.env.HELMET_HIDE_POWERED_BY || 'f__k u idiot';
const _HELMET_REFERRER_POLICY = process.env.HELMET_REFERRER_POLICY || 'no-referrer';
const _HELMET_HPKP_SHA256S_1  = process.env.HELMET_HPKP_SHA256S_1  || 'AbCdEf123=';
const _HELMET_HPKP_SHA256S_2  = process.env.HELMET_HPKP_SHA256S_2  || 'ZyXwVu456=';
const _HELMET_HPKP_REPORT_URI = process.env.HELMET_HPKP_REPORT_URI || 'https://example.com/hpkp-report';
const _REDIS_HOST             = process.env.REDIS_HOST             || 'localhost';
const _REDIS_PORT             = process.env.REDIS_PORT             || 6379;
const _REDIS_TTL              = process.env.REDIS_TTL              || 260;
// ------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------

let path = require('path');

// --------------------------------------------------------
// --------------------------------------------------------
// See this issue here https://github.com/Ks89/My-MEAN-website/issues/30
//  to understand this piece of code.
let pathFrontEndFolder, pathFrontEndIndex;
let pathFrontEndAdminIndex;
if(process.env.CI || process.env.NODE_ENV === 'test') {
  console.log("Executed in CI or TEST - providing fake '../My-MEAN-website-client' and index.html");
  //provides fake directories and files to be able to run this files
  //also with mocha in both testing and ci environments.
  //Otherwise, you are forced to run `npm run build` into ../My-MEAN-website-client's folder
  pathFrontEndFolder = path.join(__dirname);
  pathFrontEndIndex = path.join(__dirname, 'app.js');
} else {
  if(process.env.NODE_ENV === 'prod') {
    console.log(`Providing both index.html and admin.html in a production environment`);
    pathFrontEndFolder = path.join(__dirname, _FRONT_END_PATH);
    pathFrontEndIndex = path.join(__dirname, _FRONT_END_PATH, 'index.html');
    pathFrontEndAdminIndex = path.join(__dirname, _FRONT_END_PATH, 'admin.html');
  } else {
    console.log(`Providing real ${_FRONT_END_PATH}, index.html and admin.html`);
    pathFrontEndFolder = path.join(__dirname, _FRONT_END_PATH);
    pathFrontEndIndex = path.join(__dirname, _FRONT_END_PATH, 'index.html');
    pathFrontEndAdminIndex = path.join(__dirname, _FRONT_END_PATH, 'admin.html');
  }
}
// --------------------------------------------------------
// --------------------------------------------------------

let express = require('express');
let compression = require('compression');
let favicon = require('serve-favicon');
let morgan = require('morgan');
let session = require('express-session');
let bodyParser = require('body-parser');
//logger created with winston
let logger = require("./src/utils/logger");

let redis   = require("redis"); //it's really useful?
let RedisStore = require('connect-redis')(session);
let client  = redis.createClient(); //it's really useful?

// --------------------------------------------------------------------------
// ----------------------------security packages-----------------------------
// --------------------------------------------------------------------------
// All security features are prefixed with `--SEC--`
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

console.log("Initializing mongodb");
//require for mongo
require('./src/models/db');
require('./src/controllers/authentication/passport')(passport);

console.log("Initializing expressjs");
let app = express();

console.log("Initializing helmet");
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
app.use(helmet.hidePoweredBy({ setTo: _HELMET_HIDE_POWERED_BY }));

// --SEC-- - noCache to disable client-side caching [helmet]
// I don't want this for better performances (leave commented :))
// app.use(helmet.noCache())

// --SEC-- - referrer-policy to hide the Referer header [helmet]
app.use(helmet.referrerPolicy({ policy: _HELMET_REFERRER_POLICY }));

// --SEC-- - Public Key Pinning (hpkp): HTTPS certificates can be forged,
//    allowing man-in-the middle attacks.
//    HTTP Public Key Pinning aims to help that. [helmet]
const ninetyDaysInSeconds = 7776000;
app.use(helmet.hpkp({
  maxAge: ninetyDaysInSeconds,
  sha256s: [_HELMET_HPKP_SHA256S_1, _HELMET_HPKP_SHA256S_2],
  includeSubdomains: true,         // optional
  reportUri: _HELMET_HPKP_REPORT_URI, // optional
  reportOnly: false,               // optional
  // Set the header based on a condition.
  setIf: (req, res)  => req.secure //optional ()
}));

// --SEC-- - Content Security Policy (CSP): Trying to prevent Injecting anything
//    unintended into our page. That could cause XSS vulnerabilities,
//    unintended tracking, malicious frames, and more. [helmet]
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'localhost:3000', 'localhost:3001', 'www.google.com', 'www.youtube.com'],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'maxcdn.bootstrapcdn.com',
                'ajax.googleapis.com', 'cdnjs.cloudflare.com',
                'code.jquery.com', 'www.google.com',
                'www.gstatic.com'],
    styleSrc: ["'self'", 'ajax.googleapis.com', 'maxcdn.bootstrapcdn.com', 'cdnjs.cloudflare.com', "'unsafe-inline'"],
    fontSrc: ["'self'", 'maxcdn.bootstrapcdn.com'],
    imgSrc: ["'self'", 'localhost:3000', 'localhost:3001',
              'placehold.it', 'placeholdit.imgix.net', 'camo.githubusercontent.com',
              's3.amazonaws.com', 'cdnjs.cloudflare.com'],
    sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin', 'allow-popups'],
    frameSrc : ["'self'", 'www.google.com', 'www.youtube.com'], //frame-src is deprecated
    childSrc : ["'self'", 'www.google.com', 'www.youtube.com'],
    connectSrc: [
        "'self'", "cdnjs.cloudflare.com", "ajax.googleapis.com",
        "ws://localhost:3000", "ws://localhost:3001", "ws://localhost:3100",
        "ws://localhost:3300"
    ],
    reportUri: '/report-violation',
    objectSrc: ["'none'"]
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
app.use(contentLength.validateMax({max: MAX_CONTENT_LENGTH_ACCEPTED,
  status: 400, message: _LARGE_PAYLOAD_MESSAGE})); // max size accepted for the content-length


console.log("Initializing morgan (logger)");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan("default", { "stream": logger.stream }));

console.log("Initializing static resources");
app.use(express.static(pathFrontEndFolder));

console.log("Initializing bodyparser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

console.log("Initializing hpp");
// --SEC-- - http params pollution: activate http parameters pollution
// use this ALWAYS AFTER app.use(bodyParser.urlencoded()) [NOT helmet]
app.use(hpp());

console.log("Initializing Express session");
// Express Session
app.use(session({
    secret: _EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new RedisStore({ host: _REDIS_HOST, port: _REDIS_PORT, client: client, ttl :  _REDIS_TTL}),
    // cookie: {
    //   httpOnly: false,
    //     secure: false, //to use true, you must use https. If you'll use true with http it won't work.
    //     //maxAge: 2160000000
    // }
}));

console.log("Initializing passportjs");

app.use(passport.initialize());
app.use(passport.session());

// compress all requests using gzip
app.use(compression());

console.log("Initializing REST apis and CSRF");

// --------------------------------------- ROUTES ---------------------------------------
// dedicated routes for angular logging with stacktracejs
// these router aren't protected with csrf, because declared before app.use(csrf()).
let loggerApi = require('./src/routes/log-api')(express);
app.use('/api/log', loggerApi);

// enable middleware CSRF by csurf package [NOT helmet]
// before app.use('/api', routesApi); to protect their,
// but after session and/or cookie initialization
app.use(csrf());
app.use(function (req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  res.locals.csrftoken = req.csrfToken();
  next();
});

// APIs for all route protected with CSRF (all routes except for angular log's service)
let routesApi = require('./src/routes/index')(express);
app.use('/api', routesApi);
// --------------------------------------------------------------------------------------

console.log("Initializing static path for both index.html and admin.html");

app.use('/', function(req, res) {
  res.sendFile(pathFrontEndIndex);
});

app.use('/admin', function(req, res) {
  res.sendFile(pathFrontEndAdminIndex);
});

// catch bad csrf token
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  // handle CSRF token errors here
  res.status(403);
  res.json({"message" : 'session has expired or form tampered with'});
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// Catch unauthorised errors
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({"message" : err.name + ": " + err.message});
  }
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;