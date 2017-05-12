/*!
 * Copyright (c) 2016 Nanchao Inc.
 * All rights reserved.
 */

'use strict';

var Level = require('gpio').Level;
var driver = require('ruff-driver');
var async = require('ruff-async');
var Expect = require('./expect');
var Transceiver = require('./transceiver');

var BAUDRATE = 38400;
var OK_MARKER = new Buffer('OK\r\n');

var State = {
    any: 0,
    config: 1,
    data: 2
};

function asyncDelay(timeout, callback) {
    setTimeout(callback, timeout);
}

var prototype = {
    powerOn: function (callback) {
        this._pwr.write(Level.high, callback);
    },

    powerOff: function (callback) {
        this._pwr.write(Level.low, callback);
    },

    _setConfigPin: function (callback) {
        var that = this;
        this._cfg.write(Level.low, function (error) {
            if (error) {
                callback && callback(error);
                return;
            }
            setTimeout(function () {
                that._cfg.write(Level.high, callback);
            }, that._CONFIG_PIN_TIMEOUT);
        });
    },

    setConfig: function (options, callback) {
        this._state = State.config;
        var that = this;
        if (!options.gNod) {
            callback && callback(new Error('gNod is empty, should be "CMNET" or "UNINET".'));
        }
        if (!options.pAddr) {
            callback && callback(new Error('pAddr is empty.'));
        }
        if (!options.pPort) {
            callback && callback(new Error('pPort is empty.'));
        }
        async.series([
            this._setConfigPin.bind(this),
            this._sendCmd.bind(this, 'SZ+LOGIN=SHUNCOM\r\n', '+LOGIN:OK\r\n'),
            this._sendCmd.bind(this, 'SZ+BAUDRATE=' + BAUDRATE + '\r\n', OK_MARKER),
            this._sendCmd.bind(this, 'SZ+DEBUG=OFF\r\n', OK_MARKER),
            this._sendCmd.bind(this, 'SZ+GNOD=' + options.gNod + '\r\n', OK_MARKER),
            this._sendCmd.bind(this, 'SZ+PCENTERADDR=' + options.pAddr + '\r\n', OK_MARKER),
            this._sendCmd.bind(this, 'SZ+PCENTERPORT=' + options.pPort + '\r\n', OK_MARKER),
            this._sendCmd.bind(this, 'SZ+HEARTTIME=' + options.heartTime + '\r\n', OK_MARKER),
            this._sendCmd.bind(this, 'SZ+HEARTDATA=' + options.heartData + '\r\n', OK_MARKER),
            this._sendCmd.bind(this, 'SZ+REGENABLE=' + (options.regEnable ? 'ON' : 'OFF') + '\r\n', OK_MARKER),
            options.regEnable ? this._sendCmd.bind(this, 'SZ+REGDATA=' + options.regData + '\r\n', OK_MARKER) : setImmediate.bind(undefined),
            // this._sendCmd.bind(this, 'SZ+READ\r\n', '+READ:OK\r\n'),
            this._sendCmd.bind(this, 'SZ+SAVE\r\n', 'Exit set mode ok!\r\nPlease input your data to continue...'),
            asyncDelay.bind(undefined, this._EXIT_CONFIG_TIMEOUT)
        ], function (error) {
            if (error) {
                callback && callback(error);
                return;
            }
            that._cmdMonitor = null;
            that._state = State.data;
            callback && callback();
        });
    },

    setDataMode: function (callback) {
        var that = this;
        if (this._state === State.data) {
            callback && process.nextTick(callback);
            return;
        }
        setTimeout(function () {
            that._state = State.data;
            callback && callback();
        }, this._IDLE_TIMEOUT);
    },

    send: function (data, callback) {
        if (this._state === State.data) {
            var dataBuffer = typeof data === 'string' ? Buffer.from(data) : data;
            this._transceiver.transmit(dataBuffer, callback);
        } else {
            process.nextTick(function () {
                callback(new Error('None data mode, cannot send data.'));
            });
        }
    },

    _sendCmd: function (cmd, responseMarker, callback) {
        this._cmdMonitor = new Expect(responseMarker, this._CMD_TIMEOUT, callback);
        if (cmd) {
            this._uart.write(cmd);
        }
    },

    _processUartData: function (data) {
        if (this._state === State.data) {
            this._transceiver.feed(data);
        } else {
            this._cmdMonitor && this._cmdMonitor.feed(data);
        }
    }
};

module.exports = driver({
    attach: function (inputs, context) {
        var that = this;
        this._pwr = inputs['pwr'];
        this._cfg = inputs['cfg'];
        this._uart = inputs['uart'];
        this._state = State.any;

        var args = context.args || {};
        this._CONFIG_PIN_TIMEOUT = args.CONFIG_PIN_TIMEOUT || 3500;
        this._CMD_TIMEOUT = args.CMD_TIMEOUT || 10000;
        this._IDLE_TIMEOUT = args.IDLE_TIMEOUT || 20000;
        this._EXIT_CONFIG_TIMEOUT = args.EXIT_CONFIG_TIMEOUT || 5000;

        this._uart.on('data', function (data) {
            that._processUartData(data);
        });
        this._transceiver = new Transceiver(this._uart);
        this._transceiver.on('data', function (data) {
            that.emit('data', data);
        });

    },
    exports: prototype
});
