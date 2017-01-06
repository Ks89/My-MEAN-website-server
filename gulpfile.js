
// deprecated thanks to gulpfile.babel.js

var gulp        = require('gulp');
var jshint      = require('gulp-jshint');
var mocha 			= require('gulp-mocha');
var istanbul 		= require('gulp-istanbul');
var gutil       = require('gulp-util');
var del         = require('del');
var browserSync = require('browser-sync').create();
var nodemon 		= require('gulp-nodemon');
var sourcemaps  = require('gulp-sourcemaps');
var through     = require('through2');
var args 	= require('yargs').argv;
var exit 				= require('gulp-exit');
var isprod = (args.env === 'production');

//call gulp -env value -frontendpath value
console.log("args.env is: " + args.env);
console.log("args.frontendpath is: " + args.frontendpath);

var noop = function() {
	return through.obj();
};

var dev = function(task) {
	return isprod ? noop() : task;
};

var prod = function(task) {
	return isprod ? task : noop();
};

// ***************************************************
// *                   FILE PATHS                    *
// ***************************************************

var filePaths = ['src/**/*.js', './app.js'];
var testHintJs = ['src/**/*.js', './app.js'];
var testPaths;
if(process.env.CI) {
  testPaths = [
    'test-server-unit/util.spec.js',
    'test-server-integration/**/*.spec.js',
    'test-server-unit/3dparty-passport.spec.js',
    'test-server-unit/auth-experimental-collapse-db.spec.js',
    'test-server-unit/auth-util.spec.js',
    'test-server-unit/passport.spec.js',
    'test-server-unit/users.spec.js'
  ];
} else {
  testPaths = [
    'test-server-unit/util.spec.js',
    'test-server-integration/**/*.spec.js',
    'test-server-unit/3dparty-passport.spec.js',
    'test-server-unit/auth-experimental-collapse-db.spec.js',
    'test-server-unit/auth-util.spec.js',
    'test-server-unit/passport.spec.js',
    'test-server-unit/users.spec.js'
  ];
}

var sourcemapPaths = ['src/**/*.js'];

// ***************************************************
// *                     JSHINT                      *
// ***************************************************

gulp.task('hint', function hintInternal() {
	return gulp.src(testHintJs /*, {since: gulp.lastRun('hint')}*/)
	.pipe(jshint())
	.pipe(jshint.reporter('default'))
	.pipe(jshint.reporter('fail'));
});

// ***************************************************
// *                      TEST                       *
// ***************************************************

gulp.task('pre-test', function pretestInternal() {
  return gulp.src(sourcemapPaths)
		// optionally load existing source maps
    .pipe(sourcemaps.init())
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

function handleError(err) {
  console.log(err.toString());
  // this.emit('end');
}

gulp.task('test',
	gulp.series('pre-test', function testInternal() {
  return gulp.src(testPaths)
    .pipe(mocha({
      timeout: 10000,
      useColors: true
    }))
    // .pipe(mocha().on("error", handleError))
    // // Creating the reports after tests ran
    .pipe(istanbul.writeReports({
      dir: './coverage',
      reporters: [ 'lcov', 'json', 'text', 'text-summary' ],
      reportOpts: { dir: './coverage' },
    }))
    // to force gulp to exit (because my integration testing aren't closing connections / server)
    .pipe(exit());

    // Enforce a coverage of at least 90% otherwise throw an error
    // FIXME this throws an error. I don't known why. Probably it's a gulp's bug
    // .pipe(istanbul.enforceThresholds({ thresholds: { global: 80,  each: 85 } }));
}));

// ***************************************************
// *                    LOCAL ENV                    *
// ***************************************************

gulp.task('nodemon', function nodemonInternal(cb) {
	var started = false;
	return nodemon({
		script: 'bin/www',
		// watch core server file(s) that require server restart on change
    //watch: ['app.js']
		// ext: 'js html',
		env: { 'NODE_ENV': process.env.NODE_ENV }
	})
	.on('start', function nodemonStartInternal() {
		browserSync.reload();
		if(!started) {
			cb();
			started = true;
		}

	})
	.on('error', function nodemonErrInternal(err) {
     // Make sure failure causes gulp to exit
     throw err;
 });
});


gulp.task('server',
	gulp.series('nodemon', function bSyncInternal() {

	  // for more browser-sync config options: http://www.browsersync.io/docs/options/
	  browserSync.init({

	    // informs browser-sync to proxy our expressjs app which would run at the following location
	    proxy: 'http://localhost:3000',

	    // informs browser-sync to use the following port for the proxied app
	    // notice that the default port is 3000, which would clash with our expressjs
	    port: 3001,

	    // open the proxied app in chrome
	    browser: ["google chrome"]
	 });
	})
);

gulp.task('default',
	gulp.series('hint', 'server', function watcher(done) {
		    gulp.watch(filePaths, browserSync.reload);
		})
);
