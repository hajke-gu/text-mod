#!/bin/bash

npm i
npm i 
USERNAME=$1
PASSWORD=$2
gnome-terminal -?
gnome-terminal -- /bin/sh -c 'node puppeteer.js -u $USERNAME -p $PASSWORD -h' && npm run start
