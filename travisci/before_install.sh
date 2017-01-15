#!/usr/bin/env bash

echo "Before install - OS is $TRAVIS_OS_NAME"

#echo "Updating homebrew and mongodb"
#if [[ $TRAVIS_OS_NAME = 'osx' ]]; then
#	brew update
##	brew outdated mongodb || brew upgrade mongodb
#    brew install mongodb --with-openssl
#    #create a folder for mongodb to prevent an error on mac osx
#    sudo mkdir -p /data/db
#fi

echo "Exporting env variables dependencies"
# in this project, all env variables are the same for both linux and osx
echo "Exporting env variables - OS is $TRAVIS_OS_NAME"
export NODE_ENV=test
export CI=yes
export JWT_SECRET=faketestjwt
export TWITTER_CONSUMER_KEY=consumerkey
export TWITTER_CONSUMER_SECRET=consumersecret
export TWITTER_CALLBACK_URL=http://127.0.0.1:3300/api/auth/twitter/callback
export FACEBOOK_APP_ID=appid
export FACEBOOK_APP_SECRET=appsecret
export FACEBOOK_CALLBACK_URL=http://localhost:3300/api/auth/facebook/callback
export GOOGLE_CLIENT_ID=clientid
export GOOGLE_CLIENT_SECRET=clientsecret
export GOOGLE_CALLBACK_URL=http://localhost:3300/api/auth/google/callback
export GITHUB_CLIENT_ID=clientid
export GITHUB_CLIENT_SECRET=clientsecret
export GITHUB_CALLBACK_URL=http://localhost:3300/api/auth/github/callback
export LINKEDIN_CLIENT_ID=clientid
export LINKEDIN_CLIENT_SECRET=clientsecret
export LINKEDIN_CALLBACK_URL=http://localhost:3300/api/auth/linkedin/callback
export USER_EMAIL=fake@fake.it
export PASS_EMAIL=fakepasswordemail
export RECAPTCHA_PUBLIC=recaptchapublic
export RECAPTCHA_SECRET=recaptchasecret
echo "NODE_ENV = $NODE_ENV"
echo "CI = $CI"
echo "JWT_SECRET = $JWT_SECRET"
echo "TWITTER_CONSUMER_KEY = $TWITTER_CONSUMER_KEY"
echo "TWITTER_CONSUMER_SECRET = $TWITTER_CONSUMER_SECRET"
echo "TWITTER_CALLBACK_URL = $TWITTER_CALLBACK_URL"
echo "FACEBOOK_APP_ID = $FACEBOOK_APP_ID"
echo "FACEBOOK_APP_SECRET = $FACEBOOK_APP_SECRET"
echo "FACEBOOK_CALLBACK_URL = $FACEBOOK_CALLBACK_URL"
echo "GOOGLE_CLIENT_ID = $GOOGLE_CLIENT_ID"
echo "GOOGLE_CLIENT_SECRET = $GOOGLE_CLIENT_SECRET"
echo "GOOGLE_CALLBACK_URL = $GOOGLE_CALLBACK_URL"
echo "GITHUB_CLIENT_ID = $GITHUB_CLIENT_ID"
echo "GITHUB_CLIENT_SECRET = $GITHUB_CLIENT_SECRET"
echo "GITHUB_CALLBACK_URL = $GITHUB_CALLBACK_URL"
echo "LINKEDIN_CLIENT_ID = $LINKEDIN_CLIENT_ID"
echo "LINKEDIN_CLIENT_SECRET = $LINKEDIN_CLIENT_SECRET"
echo "LINKEDIN_CALLBACK_URL = $LINKEDIN_CALLBACK_URL"
echo "USER_EMAIL = $USER_EMAIL"
echo "PASS_EMAIL = $PASS_EMAIL"
echo "RECAPTCHA_PUBLIC = $RECAPTCHA_PUBLIC"
echo "RECAPTCHA_SECRET = $RECAPTCHA_SECRET"



echo "Installing $TRAVIS_OS_NAME global dependencies"
npm install -g mocha
npm install -g nodemon
npm install -g gulp@github:gulpjs/gulp#4.0