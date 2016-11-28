[![Build Status](https://travis-ci.org/Ks89/My-MEAN-website-server.svg?branch=master)](https://travis-ci.org/Ks89/My-MEAN-website-server)   [![Code Climate](https://codeclimate.com/github/Ks89/My-MEAN-website/badges/gpa.svg)](https://codeclimate.com/github/Ks89/My-MEAN-website)   [![Test Coverage](https://codeclimate.com/github/Ks89/My-MEAN-website/badges/coverage.svg)](https://codeclimate.com/github/Ks89/My-MEAN-website/coverage)   [![Known Vulnerabilities](https://snyk.io/test/github/ks89/my-mean-website/d620ace0396e9b862127bb9700b71af1a20eaca1/badge.svg)](https://snyk.io/test/github/ks89/my-mean-website/d620ace0396e9b862127bb9700b71af1a20eaca1)
<br>
# My M.E.A.N. website server/back-end (Alpha)
<br>
**This is the server side.** Client side is available [HERE](https://github.com/Ks89/My-MEAN-website-client)
<br>
## Informations
My MEAN website is a MEAN's web application that I'm creating as a personal website, but also for other uses.
It's composed by:
- A: a front-end in Angular 2
- N + E: a back-end in Node.js + Express js (and other useful libs like PassportJs)
- M: a MongoDb's database
- redis
- webpack + gulp
- and other stuff

A possible extension of this project will be a configurable template to build a custom web app very quickly. This is my final goal, please be patient :)

Attention! This project is still an alpha, so it's not production ready. Please be careful.
If you are interested, star this project on GitHub.

Testing:
- back-end unit: almost done (only the necessary things)*. coverage >=90%
- back-end integration: almost done*. coverage >=90%

(*) I unit-tested only public functions and I tested all APIs (integration) except for OAUTH2/PassportJS.
This is because, it's extremely difficult to test passportjs (for 3dparty services, not for the local auth) without to use  browsers (like Zombie or Phantom). In my opinion an integration-test for a back-end api must use only backend's code, not also a browser (browser is on client and not on server :) ).
The problem is that to test PassportJS without a browser it's really diffult. I asked on StackOverflow [HERE](http://stackoverflow.com/questions/38169351/how-can-i-test-integration-testing-with-supertest-a-node-js-server-with-passpo), without receivend any answers.
For this reason, I decided to unit-tests these APIs (not APIs theirself but their functions/logics).
If you want to help me to write integration-test's case for PassportJS, check [this file](https://github.com/Ks89/My-MEAN-website/blob/master/test-server-integration/TODO-auth-3dparty.js)

## Requirements
- Node.js
- MongoDB
- redis
- npm
- some global npm dependencies: mocha, nodemon, gulp 4.0 alpha, remap-istanbul
- work in progress... (this is only an alpha, please be patient)

## News
- *11/28/2016* - **My MEAN website** Alpha 3 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases)
- *10/27/2016* - **My MEAN website** Alpha 2 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-2.2)
- *08/15/2016* - **My MEAN website** Alpha 1 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-1)


## How to install (MacOS)
- from the `setup` folder of this project, run `bash install-macos.sh`

## How to install (Linux)
- from the `setup` folder of this project, run `bash install-linux.sh`

## How to install (Windows)
- install Node.js, MongoDb, redis-server and so on
- from the `setup` folder of this project, run `bash install-windows.sh`
- TODO improve this tutorial :)

## How to setup

1. create a file called ".env" into the root folder and add all these properties
```
JWT_SECRET=INSERT A JEW SECRET HERE

TWITTER_CONSUMER_KEY=YOU KEY/ID
TWITTER_CONSUMER_SECRET=YOU KEY/ID
TWITTER_CALLBACK_URL=YOUR CALLBACK URL for [example](http://127.0.0.1:3300/api/auth/twitter/callback)

FACEBOOK_APP_ID=YOU KEY/ID
FACEBOOK_APP_SECRET=YOU KEY/ID
FACEBOOK_CALLBACK_URL=YOUR CALLBACK URL for [example](http://localhost:3300/api/auth/facebook/callback)

GOOGLE_CLIENT_ID=YOU KEY/ID
GOOGLE_CLIENT_SECRET=YOU KEY/ID
GOOGLE_CALLBACK_URL=YOUR CALLBACK URL for [example](http://localhost:3300/api/auth/google/callback)

GITHUB_CLIENT_ID=YOU KEY/ID
GITHUB_CLIENT_SECRET=YOU KEY/ID
GITHUB_CALLBACK_URL=YOUR CALLBACK URL for [example](http://localhost:3300/api/auth/github/callback)

LINKEDIN_CLIENT_ID=YOU KEY/ID
LINKEDIN_CLIENT_SECRET=YOU KEY/ID
LINKEDIN_CALLBACK_URL=YOUR CALLBACK URL for [example](http://localhost:3300/api/auth/linkedin/callback)

USER_EMAIL=YOUR_EMAIL
PASS_EMAIL=YOUR_PASSWORD

RECAPTCHA_PUBLIC=YOUR GOOGLE RECAPTCHA 2 PUBLIC KEY
RECAPTCHA_SECRET=YOUR GOOGLE RECAPTCHA 2 SECRET KEY
```
1a. replace 'YOU KEY/ID' with the keys obtained from facebook/github... oauth applications.
1b. replace YOUR_EMAIL and YOUR_PASSWORD with the data of your e-mail account
1c. replace 'YOUR GOOGLE RECAPTCHA...' with Google Recaptcha2's keys
1d. reaplce INSERT A JWT SECRET HERE with an alphanumerical string (I'm using a random string with a length = 72)

2. install all necessary tools (Node.js, redis-server, mongo db)
3. execute this command `npm install` into the root folder
4. execute this command `redis-server
5. execute this command `mongod` (on Mac OSX use `sudo mongod`)
6. execute this command `gulp` into the root folder to start this application (back-end)

All REST webservices will be available at http://localhost:3001

## How to run tests (server-side)
If you want to run server's tests execute this command `gulp test`.

## How to start
- cd 'main folder of this project'
- `gulp`
- all REST services will be available at http://localhost:3001

## Features
Work in progress... (this is only an alpha, please be patient)

## Future extensions
Work in progress... (this is only an alpha, please be patient)

## Images

![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/home.png)
<br/><br/>
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/projects.png)
<br/><br/>
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/projectDetail.png)
<br/><br/>
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/projectDetail-image.png)
<br/><br/>
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/contact.png)
<br/><br/>
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/contact-images.png)
<br/><br/>
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/signin.png)
<br/><br/>
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/register.png)
<br/><br/>
Note: updated local profile info
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/profile-updated.png)
<br/><br/>
Note: multiple account connected (Facebook and Github)
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/profile-multiple.png)

## Configuration
Work in progress... (this is only an alpha, please be patient)

## Thanks
A special thanks to the authors of this book, because very useful to understand how to develop a modern web application: [BOOK1](https://www.manning.com/books/getting-mean-with-mongo-express-angular-and-node)

## License

Copyright 2015-2016 Stefano Cappa

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

<br/>
**Created by Stefano Cappa**
