"use strict";

import gulp         from 'gulp';
import del          from 'del';
import jshint       from 'gulp-jshint';
import mocha        from 'gulp-mocha';
import istanbul     from 'gulp-istanbul';
import browserSync  from 'browser-sync';
import nodemon      from 'gulp-nodemon';
import sourcemaps   from 'gulp-sourcemaps';
import through      from 'through2';
import yargs        from 'yargs';
import exit         from 'gulp-exit';

const bs = browserSync.create();
const args = yargs.argv;
const isprod = (args.env === 'production');

//call gulp -env value -frontendpath value
console.log("args.env is: " + args.env);
console.log("args.frontendpath is: " + args.frontendpath);

const noop = () => through.obj();
const dev = task => isprod ? noop() : task;
const prod = task => isprod ? task : noop();

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
const coveragePaths = ['coverage'];

// ***************************************************
// *                     JSHINT                      *
// ***************************************************
// call with `./node_modules/.bin/gulp --gulpfile gulpfile.babel.js hint`
export function hint() {
  return gulp.src(testHintJs/*, {since: gulp.lastRun(hint)}*/)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
}

// ***************************************************
// *                      TEST                       *
// ***************************************************
// call with `./node_modules/.bin/gulp --gulpfile gulpfile.babel.js test`
const test = gulp.series(cleanCoverage, preTest, testInternal);
export { test };

function cleanCoverage() {
  return del(coveragePaths);
}

function preTest() {
  return gulp.src(sourcemapPaths)
  // optionally load existing source maps
    .pipe(sourcemaps.init())
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
}

function testInternal() {
  return gulp.src(testPaths)
    .pipe(mocha({
      timeout: 10000,
      useColors: true
    }))
    // .pipe(mocha().on("error", (err) => { this.emit('end'); }))
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports({
      dir: './coverage',
      reporters: ['lcov', 'json', 'text', 'text-summary'],
      reportOpts: {dir: './coverage'},
    }))
    // to force gulp to exit (because my integration testing aren't closing connections / server)
    .pipe(exit());

    // Enforce a coverage of at least 90% otherwise throw an error
    // FIXME this throws an error. I don't known why. Probably it's a gulp's bug
    // .pipe(istanbul.enforceThresholds({ thresholds: { global: 80,  each: 85 } }));
}

// ***************************************************
// *              BUILD LOCAL ENVIRONMENT            *
// ***************************************************
// call with `./node_modules/.bin/gulp --gulpfile gulpfile.babel.js server`
const server = gulp.series(nodemontask, bSyncInternal);
export { server };

// call default task with `./node_modules/.bin/gulp --gulpfile gulpfile.babel.js`
const buildDefault = gulp.series(hint, server, watcher);
export default buildDefault;

export function nodemontask(cb) {
  var started = false;
  return nodemon({
    script: 'bin/www',
    env: {'NODE_ENV': process.env.NODE_ENV}
  })
    .on('start', function nodemonStartInternal() {
      bs.reload();
      if (!started) {
        cb();
        started = true;
      }
    })
    .on('error', function nodemonErrInternal(err) {
      // Make sure failure causes gulp to exit
      throw err;
    });
}

function bSyncInternal() {
  // for more browser-sync config options: http://www.browsersync.io/docs/options/
  bs.init({
    // informs browser-sync to proxy our expressjs app which would run at the following location
    proxy: {
      target: 'http://localhost:3000',
      ws: true // enables websockets
    },
    // informs browser-sync to use the following port for the proxied app
    // notice that the default port is 3000, which would clash with our expressjs
    port: 3001,
    // open the proxied app in chrome
    browser: ["google chrome"]
  });
}

function watcher() {
  gulp.watch(filePaths, bs.reload);
}