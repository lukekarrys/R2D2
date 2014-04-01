#! /usr/bin/env node

var program = require('commander');
var modulePackage = require('./package');
var defaults = {
    server: process.env.SERVER || 'http://signalmaster.dokku.lukekarrys.com'
};

program
    .version(modulePackage.version)
    .option('--server [server]', 'Server', String, defaults.server)
    .parse(process.argv);



var io = require('socket.io-client');
var socket = io.connect(program.server);
var _ = require('underscore');
var R2D2 = require('./index');
var R2D2ringer = R2D2({
    ascii: false
});
var meId;

var ring = function (ids) {
    if (ids.length > 0) {
        R2D2ringer(function () {
            console.log('Ringing', ids);
        });
    }
};

socket.on('connect', function () {
    meId = socket.socket.sessionid;
    console.log('connected', meId);

    socket.emit('join', 'lukekarrys', function (err, roomDesc) {
        // If there are clients in the room when we join
        // other than this listener, attempt to ring
        var others = _.without(_.keys(roomDesc.clients), meId);
        ring(others);
    });

    socket.on('join', function (data) {
        var here = data.here;
        var joinedId = data.id;
        var others = _.without(here, joinedId, meId);

        // If a client joins other than this listener
        // And it is the first client, attempt to ring
        // We only ring for the first client
        if (joinedId !== meId && others.length === 0) {
            ring(joinedId);
        }
    });
});
