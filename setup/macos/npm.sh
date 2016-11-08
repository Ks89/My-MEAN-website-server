#!/bin/bash

#ONLY FOR macOS
#DON'T EXECUTE THIS - BUT USE install-macos.sh

read -p "Would you install npm global packages? Press y or n: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo installing npm global packages
  sudo npm install -g mocha
  sudo npm install -g nodemon
  sudo npm install -g gulp@github:gulpjs/gulp#4.0
  sudo npm install -g remap-istanbul
  sudo npm install -g codeclimate-test-reporter
  sudo npm install -g istanbul
  sudo npm install -g snyk
fi
