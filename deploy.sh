#!/bin/bash

TMP=`mktemp -d -t jsnes.XXXXXX`

# Use TAR as a hack to preserve the directory structure.
TAR=jsnes.tar
tar cf $TMP/$TAR \
    retrousb.html \
    lib/dynamicaudio-min.js \
    lib/dynamicaudio.swf \
    source/nes.js \
    source/utils.js \
    source/cpu.js \
    source/keyboard.js \
    source/mappers.js \
    source/papu.js \
    source/ppu.js \
    source/rom.js \
    source/retrousbcontroller.js \
    source/retrousbui.js

# Clean up the files.
cd $TMP
tar xf $TAR
rm $TAR
cp retrousb.html index.html

# Upload the files.
HOST=bolinfest.com
DIR=/www/jsnes.bolinfest.com/
scp -r . ${HOST}:${DIR}

# Clean up.
cd -
rm -rf $TMP
