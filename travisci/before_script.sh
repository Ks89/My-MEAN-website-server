#!/usr/bin/env bash

echo "Before script - OS is $TRAVIS_OS_NAME"

echo "Setting xvfb based on TRAVIS_OS_NAME"
# setting xvfb on Linux https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-xvfb-to-Run-Tests-That-Require-a-GUI
if [[ $TRAVIS_OS_NAME == 'linux' ]]; then
    echo "Before script on $TRAVIS_OS_NAME"
    echo "$TRAVIS_OS_NAME doesn't require a custom configuration"
else
    echo "Installing mongodb on $TRAVIS_OS_NAME"
    brew install mongodb --with-openssl
    #create a folder for mongodb to prevent an error on mac osx
    sudo mkdir -p /data/db
#    brew services start mongodb

    echo "Installing redis on $TRAVIS_OS_NAME"
    wget http://download.redis.io/redis-stable.tar.gz
    tar xvzf redis-stable.tar.gz
    cd redis-stable
    make install
    cd ..
    rm -rf redis-stable
    rm -f redis-stable.tar.gz
fi
