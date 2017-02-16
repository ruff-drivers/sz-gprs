/*!
 * Copyright (c) 2017 Nanchao Inc.
 * All rights reserved.
 */

'use strict';

var assert = require('assert');
var mock = require('ruff-mock');
var when = mock.when;

var Transceiver = require('../src/transceiver');

require('t');

describe('Test for Transceiver', function () {
    var port;
    before(function () {
        port = mock({
            write: Function
        });
    });

    it('should transmit packed data', function (done) {
        var transceiver = new Transceiver(port);
        var data = Buffer.from('abc');
        var expectedData = Buffer.from([0xFE, 0xEF, 0x03, 0x00, 73, 87, 97, 98, 99, 0xF0, 0x0F]);
        when(port).write(expectedData, Function).then(function (expectedData, callback) {
            callback();
        });
        transceiver.transmit(data, function (error) {
            if (error) {
                done(error);
                return;
            }
            done();
        });
    });

    it('should get expected data when unpack received data', function (done) {
        var receivedData = Buffer.from([0xFE, 0xEF, 0x03, 0x00, 73, 87, 97, 98, 99, 0xF0, 0x0F]);
        var transceiver = new Transceiver(port);
        transceiver.on('data', function (data) {
            assert.equal(data, 'abc');
            done();
        });
        transceiver.feed(receivedData);
    });
});
