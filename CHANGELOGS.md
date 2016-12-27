# Changelog

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