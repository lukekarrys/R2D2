#! /usr/bin/env node

var program = require('commander');
var modulePackage = require('./package');
var defaults = {
    server: process.env.SERVER || 'https://api.talky.io:443' || 'http://signaling.simplewebrtc.com:8888',
    room: process.env.ROOM || 'lukes-magical-r2d2-telephone'
};

program
    .version(modulePackage.version)
    .option('--server [server]', 'Server', String, defaults.server)
    .option('--room [room]', 'Room', String, defaults.room)
    .option('--dry [dry]', 'Dry run', Boolean, false)
    .parse(process.argv);


var io = require('socket.io-client');
var socket = io.connect(program.server);
var _ = require('underscore');
var R2D2 = require('./index');
var R2D2ringer = R2D2({
    ascii: false
});
var here = [];

function ring(event) {
    if (program.dry) {
        console.log('Ringing due to', event);
    } else {
        R2D2ringer(function () {
            console.log('Ringing due to', event);
        });
    }
}

function removeFromArray(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

socket.on('connect', function () {
    console.log('connected as', socket.socket.sessionid);

    socket.emit('join', program.room, function (err, roomDesc) {
        if (err) {
            console.error(err);
            return;
        }
        here = _.keys(roomDesc.clients);
        console.log('ROOM:', program.room);
        console.log('CONNECTED:', here.join(', '));
        if (here.length > 0) {
            ring(here.join(', '));
        } else {
            console.log('Room is empty');
        }
    });

    socket.on('message', function (message) {
        if (message.type === 'offer') {
            console.log('JOINED:', message.from);
            if (here.length === 0) {
                ring(message.from);
            }
            here.push(message.from);
        }
    });

    socket.on('remove', function (message) {
        console.log('LEFT:', message.id);
        removeFromArray(here, message.id);
    });
});
