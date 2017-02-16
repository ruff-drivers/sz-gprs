/*!
 * Copyright (c) 2017 Nanchao Inc.
 * All rights reserved.
 */

'use strict';

var assert = require('assert');

var Expect = require('../src/expect');

require('t');

describe('Test for Expect', function () {
    it('should get expeced data within given time', function (done) {
        var marker = Buffer.from('end');
        var expect = new Expect(marker, 100, function (error, leftBuffer) {
            if (error) {
                done(error);
                return;
            }
            assert(leftBuffer.compare(Buffer.from('456')) === 0);
            done();
        });
        expect.feed(Buffer.from('123en'));
        expect.feed(Buffer.from('d456'));
    });

    it('should throw timeout error when timeout is greater than 0', function (done) {
        var marker = Buffer.from('end');
        var expect = new Expect(marker, 100, function (error) {
            if (error) {
                assert(error instanceof Error);
                done();
                return;
            }
        });
        expect.feed(Buffer.from('123en456'));
    });

    it('should not throw timeout error when timeout is 0', function (done) {
        var marker = Buffer.from('end');
        var expect = new Expect(marker, 0, function (error, leftBuffer) {
            if (error) {
                done(error);
                return;
            }
            assert(leftBuffer.compare(Buffer.from('456')) === 0);
            done();
        });
        expect.feed(Buffer.from('123en456'));
        setTimeout(done, 500);
    });
});
