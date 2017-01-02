#!/usr/bin/env bash

# try to execute gulp test more times until success
# after a success (return 0), this script will stop itself
n=0
until [ $n -ge 5 ] # 5 times
do
  gulp test && break
  n=$[$n+1]
  sleep 3 # wait 3 seconds
done

# send test coverage to codeclimate.com
codeclimate-test-reporter < coverage/lcov.info
# send test coverage to coveralls.io
npm run coveralls