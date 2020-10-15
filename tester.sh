#!/bin/bash

npm i
USERNAME=$1
PASSWORD=$2
echo $PWD

gnome-terminal -- /bin/sh -c 'node puppeteer.js -u $USERNAME -p $PASSWORD -h' && npm run start
