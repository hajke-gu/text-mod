#!/bin/bash

sudo apt-get update
sudo apt-get install gnome-terminal
npm i
USERNAME=$1
PASSWORD=$2
gnome-terminal -?
gnome-termina --display=0
gnome-terminal -- --display=0 /bin/sh -c 'node puppeteer.js -u $USERNAME -p $PASSWORD -h' && npm run start
