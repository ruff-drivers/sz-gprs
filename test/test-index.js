/*!
 * Copyright (c) 2017 Nanchao Inc.
 * All rights reserved.
 */

'use strict';

var Level = require('gpio').Level;
var mock = require('ruff-mock');
var when = mock.when;
var any = mock.any;

var Gprs = require('../src/index');

require('t');

function Uart() {
    this._readCallbackQueue = [];
    this._buffer = new Buffer(0);

    var that = this;
    this._timer = setInterval(function () {
        if (that._buffer.length && that._readCallbackQueue.length) {
            var buffer = that._buffer;
            that._buffer = new Buffer(0);
            // eslint-disable-next-line no-useless-call
            that._readCallbackQueue.shift().call(undefined, undefined, buffer);
        }
    }, 10);
}
Uart.prototype.read = function (callback) {
    this._readCallbackQueue.push(callback);
};
Uart.prototype.write = function (data, callback) {
    process.nextTick(function () {
        callback && callback();
    });
};
Uart.prototype.pushData = function (data) {
    this._buffer = Buffer.concat([this._buffer, data]);
};
Uart.prototype.clearTimer = function () {
    clearInterval(this._timer);
};

describe('Test for Gprs', function () {
    var gprs;
    var gpio = {
        write: Function
    };
    var uart;
    var pwr;
    var cfg;

    beforeEach(function () {
        pwr = mock(gpio);
        cfg = mock(gpio);
        uart = mock(new Uart());
        gprs = new Gprs({
            pwr: pwr,
            cfg: cfg,
            uart: uart
        }, {
            args: {
                CONFIG_PIN_TIMEOUT: 50,
                CMD_TIMEOUT: 200,
                IDLE_TIMEOUT: 100,
                EXIT_CONFIG_TIMEOUT: 100
            }
        });
    });
    afterEach(function () {
        uart.clearTimer();
    });

    it('should power on gprs module', function (done) {
        when(pwr).write(Level.high, Function).then(function (level, callback) {
            callback();
        });
        gprs.powerOn(done);
    });
    it('should power off gprs module', function (done) {
        when(pwr).write(Level.low, Function).then(function (level, callback) {
            callback();
        });
        gprs.powerOff(done);
    });

    it('should config success', function (done) {
        var OK = new Buffer('OK\r\n');
        var config = {
            gNod: 'CMNET',
            pAddr: '192.168.1.1',
            pPort: 8080,
            heartTime: 5,
            heartData: 'RUFF',
            regEnable: true,
            regData: 'ONLINE'
        };
        when(cfg).write(Level.low, any).then(function (level, callback) {
            callback && callback();
        });
        when(cfg).write(Level.high, any).then(function (level, callback) {
            callback && callback();
        });
        when(uart).write('SZ+LOGIN=SHUNCOM\r\n').then(function () {
            uart.pushData(Buffer.from('+LOGIN:OK\r\n'));
        });
        when(uart).write('SZ+BAUDRATE=38400\r\n').then(function () {
            uart.pushData(OK);
        });
        when(uart).write('SZ+DEBUG=OFF\r\n').then(function () {
            uart.pushData(OK);
        });
        when(uart).write('SZ+GNOD=' + config.gNod + '\r\n').then(function () {
            uart.pushData(OK);
        });
        when(uart).write('SZ+PCENTERADDR=' + config.pAddr + '\r\n').then(function () {
            uart.pushData(OK);
        });
        when(uart).write('SZ+PCENTERPORT=' + config.pPort + '\r\n').then(function () {
            uart.pushData(OK);
        });
        when(uart).write('SZ+HEARTTIME=' + config.heartTime + '\r\n').then(function () {
            uart.pushData(OK);
        });
        when(uart).write('SZ+HEARTDATA=' + config.heartData + '\r\n').then(function () {
            uart.pushData(OK);
        });
        when(uart).write('SZ+REGENABLE=' + (config.regEnable ? 'ON' : 'OFF') + '\r\n').then(function () {
            uart.pushData(OK);
        });
        when(uart).write('SZ+REGDATA=' + config.regData + '\r\n').then(function () {
            uart.pushData(OK);
        });
        when(uart).write('SZ+SAVE\r\n').then(function () {
            uart.pushData(Buffer.from('Exit set mode ok!\r\nPlease input your data to continue...'));
        });

        gprs.setConfig(config, function (error) {
            done(error);
        });
    });
});
