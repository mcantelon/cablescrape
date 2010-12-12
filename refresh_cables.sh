#!/bin/bash
rm www.wikileaks.nl.tgz
wget http://wikimirror.opperschaap.net/www.wikileaks.nl.tgz
tar zxvf www.wikileaks.nl.tgz
rm -r -f cable
mv wikileaks.org/cable .
