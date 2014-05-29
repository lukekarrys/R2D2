#! /usr/bin/env node

var R2D2 = require('./lib/ascii');
var program = require('commander');
var modulePackage = require('./package');
var _ = require('lodash');
var AMI = require('yana');

var defaults = {
    user: 'admin',
    secret: 'admin',
    hostname: '192.168.1.181',
    port: 5038,
    extension: '1337',
    context: 'myphones',
    ascii: true
};

function ReadyAMI(options) {
    this.isReady = false;
    this.onReady = function () {};
    this.ami = new AMI({
        'port': options.port,
        'host': options.hostname,
        'login': options.user,
        'password': options.secret
    });

    this.options = options;

    this.ami.on('FullyBooted', function () {
        this.isReady = true;
        this.onReady();
    }.bind(this));

    return this;
}

ReadyAMI.prototype.run = function (cb) {
    if (this.isReady) {
        cb.call(this);
    } else {
        this.onReady = cb.bind(this);
    }
};

ReadyAMI.prototype.ring = function (options, cb) {
    if (typeof options === 'function') {
        cb = options;
        options = {};
    }
    _.extend(this.options, options);
    this.run(function () {
        this.ami.send({
            Action: 'Originate',
            Channel: 'SIP/' + this.options.extension,
            Exten: this.options.extension,
            Context: this.options.context,
            Priority: 1,
            Timeout: 1000
        }, function () {
            if (this.options.ascii) console.log(R2D2);
            if (cb) cb();
        }.bind(this));
    });
};

ReadyAMI.prototype.end = function (kill) {
    this.ami.disconnect();
    if (kill) {
        process.exit(0);
    }
};


if (!module.parent) {
    program
        .version(modulePackage.version)
        .option('--user [user]', 'Login', String, defaults.user)
        .option('--secret [secret]', 'Secret', String, defaults.secret)
        .option('--hostname [hostname]', 'Hostname', String, defaults.hostname)
        .option('--port [port]', 'Port', Number, defaults.port)
        .option('--extension [extension]', 'Extension', String, defaults.extension)
        .option('--context [context]', 'Context', String, defaults.context)
        .option('--ascii [ascii]', 'ASCII', String, defaults.ascii)
        .parse(process.argv);

    var ami = new ReadyAMI(program);
    ami.ring({}, function () {
        ami.end(true);
    });
} else {
    module.exports = function (opts) {
        opts || (opts = {});
        _.defaults(opts, defaults);
        var ami = new ReadyAMI(opts);
        return ami.ring.bind(ami);
    };
}
