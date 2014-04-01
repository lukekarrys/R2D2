var io = require('socket.io-client');

var socket = io.connect('http://signalmaster.dokku.lukekarrys.com');

socket.on('connect', function (data) {
    console.log('connect', data);

    socket.emit('room', 'lukekarrys');

    socket.on('join', function (data) {
        console.log('join', data);
    });

    socket.on('message', function (data) {
        console.log('message', data);
    });

    socket.on('remove', function (data) {
        console.log('remove', data);
    });

});


