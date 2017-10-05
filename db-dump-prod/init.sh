#!/bin/bash

mongo KS --eval 'db.projects.drop()'
mongorestore -d KS -c projects --dir=./db-dump-e2e/KS/projects.bson --maintainInsertionOrder