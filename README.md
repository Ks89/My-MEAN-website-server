[![Travis Build](https://travis-ci.org/Ks89/My-MEAN-website-server.svg?branch=master)](https://travis-ci.org/Ks89/My-MEAN-website-server)   [![AppVeyor Build](https://ci.appveyor.com/api/projects/status/x7r2v139hi84cvsj/branch/master?svg=true)](https://ci.appveyor.com/project/Ks89/my-mean-website-server/branch/master)   [![Code Climate](https://codeclimate.com/github/Ks89/My-MEAN-website-server/badges/gpa.svg)](https://codeclimate.com/github/Ks89/My-MEAN-website-server)   [![CodeClimate Coverage](https://codeclimate.com/github/Ks89/My-MEAN-website-server/badges/coverage.svg)](https://codeclimate.com/github/Ks89/My-MEAN-website-server/coverage)   [![Coveralls Coverage](https://coveralls.io/repos/github/Ks89/My-MEAN-website-server/badge.svg?branch=master)](https://coveralls.io/github/Ks89/My-MEAN-website-server?branch=master)   [![Known Vulnerabilities](https://snyk.io/test/github/ks89/my-mean-website-server/badge.svg)](https://snyk.io/test/github/ks89/my-mean-website-server)


# My M.E.A.N. website server/back-end (Alpha)


**This is the server side.** Client side is available [HERE](https://github.com/Ks89/My-MEAN-website-client)


## Informations

My MEAN website is a MEAN's web application that I'm creating as a personal website, but also for other users.
It's composed by:

- M: a MongoDb's database
- E: a back-end with Express js
- A: a front-end in Angular >= 4
- N: a back-end in Node.js
- redis
- webpack
- and other stuff

A possible extension of this project will be a configurable template to build a custom web app very quickly. This is my final goal, please be patient :)

Attention! This project is still an alpha, so it's not production ready. Please be careful.
If you are interested, star this project on GitHub, share it and create pull requests.

Testing:

- back-end unit: almost done (only the necessary things)*. coverage >=90%
- back-end integration: almost done*. coverage >=90%

(*) I unit-tested only public functions and I tested all APIs (integration) except for OAUTH2/PassportJS.
This is because, it's extremely difficult to test passportjs (for 3dparty services, not for the local auth) without to use browsers (like Zombie or Phantom). In my opinion an integration-test for a back-end api must use only backend's code, not also a browser (browser is on client and not on server :) ).
The problem is that to test PassportJS without a browser it's really difficult. I asked on StackOverflow [HERE](http://stackoverflow.com/questions/38169351/how-can-i-test-integration-testing-with-supertest-a-node-js-server-with-passpo), without receive any answers.
For this reason, I decided to unit-tests these APIs (not APIs theirself but their functions/logics).
If you want to help me to write integration-test's case for PassportJS, check [this file](https://github.com/Ks89/My-MEAN-website-server/blob/master/test-integration/TODO-auth-3dparty.experimentalspec.js)

## Requirements

- macOS, Linux or Windows 10 **with admin privileges**
- Node.js + npm
- MongoDB and redis
- some global npm dependencies
- work in progress... (this is only an alpha, please be patient)

## News

- *10/06/2017* - **My MEAN website** Alpha 9 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-6)
- *08/20/2017* - **My MEAN website** Alpha 8 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-6)
- *08/10/2017* - **My MEAN website** Alpha 7 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-6)
- *04/09/2017* - **My MEAN website** Alpha 6 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-6)
- *01/21/2017* - **My MEAN website** Alpha 5 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-5)
- *12/30/2016* - **My MEAN website** Alpha 4 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-4)
- *11/28/2016* - **My MEAN website** Alpha 3 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-3)
- *10/27/2016* - **My MEAN website** Alpha 2 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-2.2)
- *08/15/2016* - **My MEAN website** Alpha 1 public release [HERE](https://github.com/Ks89/My-MEAN-website-server/releases/tag/v.alpha-1)


## How to install (MacOS)

- from the `setup` folder of this project, run `bash install-macos.sh`
- import the db dump (.bson) from `db-dump-prod`'s folder either running `db-dump-prod/init.sh` to do it automatically thanks to both `mongo` ad `mongorestore` CLIs, or using Studio 3T (previously MongoChef)

## How to install (Linux)

*Tested only on Ubuntu*

- from the `setup` folder of this project, run `bash install-ubuntu.sh`
- import the db dump (.bson) from `db-dump-prod`'s folder either running `db-dump-prod/init.sh` to do it automatically thanks to both `mongo` ad `mongorestore` CLIs, or using Studio 3T (previously MongoChef)

## How to install (Windows)

*Tested only on Windows 10*

- install both [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/new/) and [Google Chrome](https://www.google.com/chrome/browser/desktop/index.html)
- install Node.js from the [official website](https://www.nodejs.org)
- install MongoDb Community from the [official website](https://www.mongodb.com)
- create a db called `KS` (obviously you have to start MongoDb to do that). You can configure this value later, but for debug/local environment I suggest this name
- import the db dump (.bson) from `db-dump-prod`'s folder either running `db-dump-prod/init.sh` to do it automatically thanks to both `mongo` ad `mongorestore` CLIs (if available in your PATH variable), or using Studio 3T (previously MongoChef)
- install redis-server for Windows (file .msi) [HERE](https://github.com/MSOpenTech/redis/releases)
- install Python 2.7.x from the [official website](https://www.python.org)
- from the `setup` folder of this project, run with PowerShell as administator `bash install-windows.sh`

If you'll have problems with `node-zopfli`, you have to install it properly following [this tutorial](https://github.com/nodejs/node-gyp#installation). There are two options, try with the first one `npm install --global --production windows-build-tools`, if it will fail, use option 2.
Both options will require to download really big files from microsoft.com (manually or automatically). So, be careful.

## How to setup

1. You have to rename `.env_example`'s file into `.env` (debug/local config - mandatory) and create another copy called `.env_prod` (production config)<br>
1a. Configure `FRONT_END_PATH` with the relative position of the main folder of [THE CLIENT SIDE OF THIS PROJECT](https://github.com/Ks89/My-MEAN-website-client). For `.env_prod` you should use simply `public`<br>
1b. Configure `REDIS_HOST`, `REDIS_PORT` and `REDIS_TTL`. If you are in a debug/local environment you should use the example values<br>
1c. Configure both `MONGODB_URI` and `MONGODB_TESTING_URI` with your db path. I suggest to use the example value without user/password and with a db called `KS`<br>
1d. replace `YOU KEY/ID` with the keys obtained from facebook/github... oauth applications.<br>
1e. replace `YOUR_EMAIL` and `YOUR_PASSWORD` with the data of your e-mail account<br>
1f. replace `YOUR GOOGLE RECAPTCHA...` with Google Recaptcha2's keys<br>
1g. reaplace `INSERT A JWT SECRET HERE` with an alphanumerical string (I'm using a random string with a length = 72)
2. execute this command `npm install` into the root folder  (if it will fail, run it again :))
3. start redis-server (both on Linux and Mac run `redis-server`, on Windows start `C:\Program files\Redis\redis-server.exe`)
4. start MongoDb (on Linux run `mongod`, on Mac run `sudo mongod` and on Windows start `C:\Program Files\MongoDB\Server\<your version here>\bin\mongod.exe`)
5. execute this command `npm start` into the root folder to start this application (back-end)

## How to run both unit and integration tests (server-side)

- `npm test`

## How to start (development mode)

- cd 'main folder of this project'
- `npm start`
- all REST webservices will be available at http://localhost:3000 for instance try with http://localhost:3000/api/projects

## How to start (production mode)

*I decided to use pm2 (with pm2.json config file) to run in cluster mode (`max` processes) this project in a production environment*

- cd 'main folder of this project'
- `npm run prod:start`
- all REST webservices will be available at http://localhost:3000 for instance try with http://localhost:3000/api/projects
- if you want to stop it use `npm run prod:stop`

## Features

Work in progress... (this is only an alpha, please be patient)

## Future extensions

Work in progress... (this is only an alpha, please be patient)

## Images

![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/home.png)


![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/projects.png)


![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/projectDetail.png)


![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/projectDetail-image.png)


![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/contact.png)


![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/contact-images.png)


![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/signin.png)


![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/register.png)


Note: updated local profile info
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/profile-updated.png)

Note: multiple account connected (Facebook and Github)
![alt tag](http://www.stefanocappa.it/publicfiles/Github_repositories_images/MyMeanWebsite/profile-multiple.png)

## Configuration

From Alpha 5 I created many entries in .env, so you could start to configure this application.
Work in progress... (this is only an alpha, please be patient)

## Thanks

A special thanks to the authors of this book, because very useful to understand how to develop a modern web application: [BOOK1](https://www.manning.com/books/getting-mean-with-mongo-express-angular-and-node)

## License

Copyright 2015-2017 Stefano Cappa

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
