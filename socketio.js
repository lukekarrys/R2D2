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
    .option('--verbose [verbose]', 'Verbose', Boolean, false)
    .parse(process.argv);


var io = require('socket.io-client');
var socket = io.connect(program.server);
var _ = require('underscore');
var R2D2 = require('./index');
var R2D2ringer = R2D2({
    ascii: false
});
var here = [];

if (program.verbose) {
    socket.emit = _.wrap(socket.emit, function (fn, name) {
        console.log('-->', name, _.toArray(arguments).slice(2));
        fn.apply(this, _.toArray(arguments).slice(1));
    });

    socket.$emit = _.wrap(socket.$emit, function (fn) {
        console.log('<--', arguments[1], _.toArray(arguments).slice(2));
        return fn.apply(this, _.toArray(arguments).slice(1));
    });
}

function ring(event) {
    if (program.dry) {
        console.log('RING:', event);
    } else {
        R2D2ringer(function () {
            console.log('RING:', event);
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
    console.log('CONNECTED:', socket.socket.sessionid);

    socket.emit('join', program.room, function (err, roomDesc) {
        if (err) {
            console.error(err);
            return;
        }
        here = _.keys(roomDesc.clients);
        console.log('ROOM:', program.room);
        console.log('HERE:', here.join(', ') || 'empty');
        if (here.length > 0) {
            ring(here.join(', '));
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
