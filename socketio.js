#! /usr/bin/env node


var spawn = require('child_process').spawn;
var Push = require('pushover-notifications');
var io = require('socket.io-client');
var _ = require('lodash');
var async = require('async');
var args = require('yargs');
var R2D2 = require('./index');
var R2D2Ring = R2D2({ascii: false});
var socket, here;
var program, options;
var push;


// Some servers that we might connect to and allow shorthands for later
var talkyServer = 'https://api.talky.io:443';
var simpleServer = 'http://signaling.simplewebrtc.com:8888';


// Specifiy default cli options
program = args.default({
    server: process.env.SERVER || talkyServer,
    room: 'lukes-magical-r2d2-telephone',
    dry: false,
    verbose: false,
    xhr: false,
    ip: '',
    ring: true,
    test: false,
    pushapp: process.env.PUSH_APP || '',
    pushuser: process.env.PUSH_USER || ''
})
.boolean(['dry', 'verbose', 'xhr', 'ring', 'test'])
.argv;
options = JSON.stringify(_.omit(program, '_', '$0'), null, 2);


// Just test the options
if (program.test === true) {
    console.log(options);
    process.exit(0);
}


// Set server if we are using a shorthand
if (program.server === 'talky') {
    program.server = talkyServer;
} else if (program.server === 'signalmaster') {
    program.server = simpleServer;
}


// Create our pushover notification sender
if (program.pushapp && program.pushuser) {
    push = new Push({
        user: program.pushuser,
        token: program.pushapp
    });
}


// Set socketio transport to force xhr polling per option
if (program.xhr) {
    io.transports = ['xhr-polling'];
}


// Create out socket and an array to track ids in the room
socket = io.connect(program.server);
here = [];


// Create logs for all socketio emissions if we are in verbose mode
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


// The logic for whether to send
// a push notification or not
function pushover(cb) {
    if (push) {
        push.send({
            message: 'Someone is contacting you!',
            url: 'http://talkto.lukekarrys.com',
            url_title: 'Talk to them!'
        }, function (err) {
            cb(null, err ? 'Could not send Pushover message' : 'Pushover message sent successfully');
        });
    } else {
        cb(null, 'No Pushover token or user');
    }
}


// The logic for whether to ring
// the phone or not
function ring(cb) {
    if (!program.ring) {
        cb(null, 'Ringer turned off');
    } else {
        if (program.ip) {
            // An IP address means that we only ring
            // if that IP can be succesfully pinged
            spawn('ping', ['-c', '1', program.ip]).on('close', function (code) {
                if (code === 0) {
                    R2D2Ring(function () {
                        cb(null, program.ip + ' was found and R2D2 rung successfully');
                    });
                } else {
                    cb(null, 'ping for ' + program.ip + ' unsuccessfully exited with code ' + code);
                }
            });
        } else {
            R2D2Ring(function () {
                cb(null, 'R2D2 rung successfully');
            });
        }
    }
}


// This will attempt to notify via a push notification
// and ring the R2D2 phone if those options are set
function notifyTransports(cb) {
    // Answer the notification callbacks in a
    // common format to make logging easier
    function answer(name, cb) {
        return function (err, res) {
            cb(err, [name, res]);
        };
    }

    // Run our notification transport attempts
    // These should never return an err because then
    // the other paralle functions wont run
    async.parallel([
        function (cb) {
            pushover(answer('PUSHOVER:', cb));
        },
        function (cb) {
            ring(answer('RING:', cb));
        }
    ], cb);
}


// Notify and log anything that happens when a connection is received
function notify(id) {
    var log = _.partialRight(console.log, id);

    if (program.dry) {
        // This is a dry run so just log the program options
        log('DRY:', options);
    } else {
        // Attempt to notify on the proper channels
        notifyTransports(function (err, results) {
            results.forEach(function (result) {
                log.apply(log, result);
            });
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

console.log('CONNECTING:', program.server);
socket.on('connect', function () {
    console.log('CONNECTED:', socket.socket.sessionid);

    console.log('JOINING:', program.room);
    socket.emit('join', program.room, function (err) {
        if (err) {
            console.error('JOIN ERROR:', err);
            return;
        }
        console.log('JOINED:', program.room);
    });

    socket.on('message', function (message) {
        if (message.type === 'offer') {
            console.log('JOINED:', message.from);
            if (here.length === 0) {
                notify(message.from);
            }
            here.push(message.from);
        }
    });

    socket.on('remove', function (message) {
        console.log('LEFT:', message.id);
        removeFromArray(here, message.id);
    });
});
