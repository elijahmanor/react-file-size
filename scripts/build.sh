#!/usr/bin/env bash

echo "Building..."
rm -rf public/$npm_package_version
pug --obj data.json src/index.pug --out public/$npm_package_version/
node-sass src/index.scss | postcss -c .postcssrc.json | cssmin > public/$npm_package_version/index.min.css
mustache data.json src/index.mustache.js | uglifyjs > public/$npm_package_version/index.min.js
echo "Finished building."
