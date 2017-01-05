"use strict";

import gulp from 'gulp';
import del     from    'del';

import jshint   from   'gulp-jshint';
import mocha    from  'gulp-mocha';
import istanbul from    'gulp-istanbul';
import bs from 'browser-sync';
import nodemon  from  'gulp-nodemon';
import sourcemaps from 'gulp-sourcemaps';
import through  from   'through2';
import yargs from  'yargs';
import exit    from    'gulp-exit';
import babel from 'gulp-babel';

const args = yargs.argv;

const isprod = (args.env === 'prod');

//call gulp -env value -frontendpath value
console.log("args.env is: " + args.env);
console.log("args.frontendpath is: " + args.frontendpath);

const noop = function () {
  return through.obj();
};

const dev = function (task) {
  return isprod ? noop() : task;
};

const prod = function (task) {
  return isprod ? task : noop();
};

// ***************************************************
// *                   FILE PATHS                    *
// ***************************************************

const filePaths = ['src/**/*.js', './app.js'];
const testHintJs = ['src/**/*.js', './app.js'];
const testPaths = [
  'test-server-unit/util.spec.js',
  'test-server-integration/**/*.spec.js',
  'test-server-unit/3dparty-passport.spec.js',
  'test-server-unit/auth-experimental-collapse-db.spec.js',
  'test-server-unit/auth-util.spec.js',
  'test-server-unit/passport.spec.js',
  'test-server-unit/users.spec.js'
];
const sourcemapPaths = ['src/**/*.js'];

// ***************************************************
// *                     JSHINT                      *
// ***************************************************

export function hint() {
  return gulp.src(testHintJs /*, {since: gulp.lastRun('hint')}*/)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
}

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
        reporters: ['lcov', 'json', 'text', 'text-summary'],
        reportOpts: {dir: './coverage'},
      }))
      .pipe(exit());
    // Enforce a coverage of at least 90% otherwise throw an error
    // FIXME this throws an error. I don't known why. Probabily it's a gulp's bug
    // .pipe(istanbul.enforceThresholds({ thresholds: { global: 80,  each: 85 } }));
    // .once('end', function () {
    //   process.exit();
    // });
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
    env: {'NODE_ENV': process.env.NODE_ENV}
  })
    .on('start', function nodemonStartInternal() {
      bs.reload;
      if (!started) {
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
    bs.init({

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
  gulp.series(/*hint,*/ 'server', function watcher(done) {
    gulp.watch(filePaths, bs.reload);
  })
);
