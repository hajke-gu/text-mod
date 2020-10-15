#!/bin/bash

sudo apt-get update
sudo apt-get install gnome-terminal
npm i
USERNAME=$1
PASSWORD=$2
export DISPLAY=:0.0 #required since there is no display
gnome-terminal -?
gnome-terminal -- /bin/sh -c 'node puppeteer.js -u $USERNAME -p $PASSWORD -h' && npm run start
