#!/usr/bin/env bash

echo "Travis script on CircleCI"

# run npm test
# try to execute npm test more times until success
# after a success (return 0), this script will stop itself
echo "npm test on CircleCI ready to start"
n=0
until [ $n -ge 5 ] # 5 times
do
  echo "npm test on CircleCI with n=$n"
  npm test && break
  n=$[$n+1]
  sleep 3 # wait 3 seconds
done
echo "npm test on CircleCI finished with n=$n"

echo "checking test threshold on CircleCI"
npm run nyc:threshold

echo "npm run codeclimate and coveralls on CircleCI"
npm run codeclimate
npm run coveralls