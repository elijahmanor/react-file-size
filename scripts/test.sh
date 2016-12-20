#!/usr/bin/env bash

npm run lint
BABEL_ENV=test mocha spec/ --require babel-register
