#!/usr/bin/env bash

echo "Travis script on $TRAVIS_OS_NAME"

echo "Installing pm2 on $TRAVIS_OS_NAME"
npm install pm2 -g
pm2 update


# run npm docs
echo "npm run docs on $TRAVIS_OS_NAME"
npm run docs


# run npm test
# try to execute npm test more times until success
# after a success (return 0), this script will stop itself
echo "npm test on $TRAVIS_OS_NAME ready to start"
n=0
until [ $n -ge 5 ] # 5 times
do
  echo "npm test on $TRAVIS_OS_NAME with n=$n"
  npm test && break
  n=$[$n+1]
  sleep 3 # wait 3 seconds
done
echo "npm test on $TRAVIS_OS_NAME finished with n=$n"

echo "checking test threshold"
npm run nyc:threshold