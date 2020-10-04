#!/bin/bash
#https://www.npmjs.com/package/minify

npm i minify
mkdir src/full
mv src/main.js src/full/main.js
minify src/full/main.js > src/main.js