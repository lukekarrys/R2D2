#! /usr/bin/env node

var R2D2 = "\
   .-\"\"-.  \n\
  /[] _ _\\  \n\
 _|_o_LII|_  \n\
/ | ==== | \\\n\
|_| ==== |_| \n\
 ||\" ||  || \n\
 ||LI  o ||  \n\
 ||'----'||  \n\
/__|    |__\\";

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
    .parse(process.argv);

var AMI = require('yana');
var ami = new AMI({
    'port': program.port,
    'host': program.hostname,
    'login': program.user,
    'password': program.secret
});

ami.on('FullyBooted', function (event) {
    console.log();
    console.log(R2D2);
    console.log();
    ami.send({
        Action: 'Originate',
        Channel: 'SIP/' + program.extension,
        Exten: program.extension,
        Context: program.context,
        Priority: 1,
        Timeout: 1000
    }, function (res) {
        ami.disconnect();
        process.exit(0);
    });
});