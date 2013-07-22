#!/bin/bash

TMP=`mktemp -d -t jsnes.XXXX`

TAR=$TMP/jsnes.tar
tar cf $TAR \
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

HOST=bolinfest.com
DIR=/www/jsnes.bolinfest.com/
scp $TAR ${HOST}:${DIR}
ssh ${HOST} "cd $DIR && tar xf jsnes.tar"
ssh ${HOST} "cd $DIR && cp retrousb.html index.html"

rm -rf $TMP
