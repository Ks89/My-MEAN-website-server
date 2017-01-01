#!/usr/bin/env bash

# try to execute gulp test more times until success
# after a success (return 0), this script will stop itself
n=0
until [ $n -ge 5 ] # 5 times
do
  gulp test && break  # substitute your command here
  n=$[$n+1]
  sleep 3 # wait 3 seconds
done

# send report to codeclimate
codeclimate-test-reporter < coverage/lcov.info
