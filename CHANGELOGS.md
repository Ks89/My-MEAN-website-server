# Changelog

## Alpha 9

### **Features**

- #105 improve pm2 config with config file
- #104 Improve scripts for e2e testing
- #102 with both unit and e2e testing, mailTransport is bypassed with the stub
- #100 add capability to bypass CI/test checks when running this server as backend for e2e tests
- #99 add random test execution with jasmine.json

### **Chore**

- #107 update to mocha 4.0.0
- #101 Change config.js and ennv vars to use test-db with both unit and e2e testing (also for CI)
- #106 update readme with e2e instructions

### **Bugfixes**

- #103 manage users for 3dparty services that don't want to expose either email or name

### **Refactor**

- #98 Move all tests into spec folder


## Alpha 8

### **Features**

- #92 Nodejs cluster config (not really necessary thanks to PM2 :))
- #95 update to Circle CI 2

### **Chore**

- #87 Move all process.env into config.js

### **Refactor**

- #97 create file with all apis paths
- #96 reduce similar code lines in spec files
- #90 Promisify and clean all tests with es6


## Alpha 7

- #88 **Promisify mongoose calls with bluebird**
- #89 Helmet - Expect-CT
- #83 Add Circle Ci
- #84 "npm run debug" to start app.js in debug mode into chrome dev tools

### **Chore**

- #86 Create utility to check the environment
- #80 Fix "morgan deprecated default format"
- #81 Replace console.log with Winston logger
- #82 Replace (_.isNull || _.isUndefined) with _.isNil
- #72 travis ci switch to macOS sierra using `osx_image: xcode8.2`

### **Refactor**

- #75 refactor to reduce sizes of all functions
- #78 **Replace Promises with async/await**
- #79 Refactor to follow jshint rules


## Alpha 6

### **Features**

- #77 **replace gulp with simple npm scripts**

### **Chore**

- #73 refactor npm scripts
- #76 improve jshint config

### **Bugfixes**

- #47 `gulp test` fails when istanbul coverage is higher than the specified threshold

and other small changes everywhere... :)


## Alpha 5

### **Features**

- #65 **gulpfile in es2015 with babel**
- #66 **server initial production configuration**
- #57 appveyor and travis are sending coverage report to codeclimate?
- #59 add coveralls service
- #67 All variables and urls should be defined with dotenv
- #64 `My-MEAN-website-client` folder should be a configuration param
- #69 Add apidoc.json for apidoc
- #60 add osx environment to travisci (server-side)

### **Chore**

- #58 regenerate and hide codeclimate repo token
- #63 improve windows and general documentation (install/setup)
- #70 Remove `browsersync` from `gulpfile.babel.js`, because it's useless today

### **Bugfixes**

- #55 fix and enable gulp-jshint
- #56 `gulp test` fails with integration testing due to mongoose open connections
- #36 `gulp` command fails on Windows due to browserSync

and other small changes everywhere... :)


## Alpha 4

Alpha 4 is dedicated manly to the front-end side, but I made some changes also to server-side.

### **Features**

- AppVeyor #38
- test everything #14
- client unit test - coverage >=90% (istanbul report) #25

### **Chore**

- Improve travisci config with caching npm #35

### **Bugfixes**

- Fix tests #52
- Refactor test to fix problem related to mongoose timeout #53

and other small changes everywhere... :)


## Alpha 3

Starting from this version, **server side and client side will be in two standalone projects on Github.**
This is the server side.

### **Features**

- Update back-end to helmet 3.x.x #42
- api documentation with apidocjs #50
- Improve `Password reset` #49
- server integration test - coverage >=90% (istanbul report) #24
- Improve code quality using codeclimate #43
- Replace underscore with lodash #44
- server unit test - coverage >=90% (istanbul report) #23
- check if I can build this project on windows 7 and 10 #28
- check if I can build this project on linux #27
- move all links from 3dpartyconfig.js to .env #29
- Admin web page - entry point to serve the new SPA to the client #19
- Moved from Atom to Webstorm

### **Bugfixes**

- api/users/:id is accessible to everyone #51
- travis-ci should send test coverage report to codeclimate automatically #46
- Fix 3dparty-passport-test.js #22

and other small changes everywhere... :)


## Alpha 2.2

Final implementation of Travis CI build. Finally it's ok.
Issue fixed: #20 #21 #29


## Alpha 2.1

server's tests fixed (issues #20 #30 #21 )


## Alpha 2

Huge release with a completely new front-end in Angular 2.

Composed by 250 commit over the previous release 👍


## Alpha 1

This is still the first public Alpha.
It isn't production ready!

I deployed this app on heroku, but I have some configuration problems and I decided to not post the link :)