#!/bin/bash
#https://www.npmjs.com/package/terser
#https://www.npmjs.com/package/clean-css
#https://www.npmjs.com/package/html-minifier

npm i html-minifier
npm i minify
mkdir src/full
mv src/index.html src/full/index.html
mv src/main.js src/full/main.js
mv src/main.css src/full/main.css
html-minifier src/full/index.html --collapse-whitespace --remove-comments --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-tag-whitespace --use-short-doctype --minify-css true --minify-js true -o src/index.html
minify src/full/main.js > src/main.js
minify src/full/main.css > src/main.css