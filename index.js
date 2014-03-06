#! /usr/bin/env node

var R2D2 = require('./lib/ascii');
var program = require('commander');
var modulePackage = require('./package');

program
    .version(modulePackage.version)
    .option('--user [user]', 'Login', String, 'admin')
    .option('--secret [secret]', 'Secret', String, 'admin')
    .option('--hostname [hostname]', 'Hostname', String, '192.168.1.181')
    .option('--port [port]', 'Port', Number, 5038)
    .option('--extension [extension]', 'Extension', String, '1337')
    .option('--context [context]', 'Context', String, 'myphones')
    .option('--timeout [timeout]', 'Timeout', Number, 2000)
    .option('--ascii [ascii]', 'ASCII', Boolean, false)
    .parse(process.argv);

if (program.ascii) {
    console.log(R2D2);
    return;
}

var AMI = require('yana');
var ami = new AMI({
    'port': program.port,
    'host': program.hostname,
    'login': program.user,
    'password': program.secret
});
var end = function () {
    ami.disconnect();
    process.exit(0);
};

var timeout = setTimeout(function () {
    end();
}, program.timeout);

ami.on('FullyBooted', function (event) {
    clearTimeout(timeout);
    console.log(R2D2);
    ami.send({
        Action: 'Originate',
        Channel: 'SIP/' + program.extension,
        Exten: program.extension,
        Context: program.context,
        Priority: 1,
        Timeout: 1000
    }, end);
});