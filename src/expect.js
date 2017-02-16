/*!
 * Copyright (c) 2017 Nanchao Inc.
 * All rights reserved.
 */

'use strict';

var EXPECT_MAX_BUFFER_SIZE = 128;

function Expect(marker, timeout, callback) {
    var that = this;
    this._marker = Buffer.from(marker);
    this._callback = callback;
    this._dataBuffer = new Buffer(0);

    if (timeout) {
        this._timer = setTimeout(function () {
            that._callback(new Error('Timeout, no expected data received.'));
        }, timeout);
    }
}

Expect.prototype.feed = function (data) {
    if (this._dataBuffer.length + data.length > EXPECT_MAX_BUFFER_SIZE) {
        this._dataBuffer = this._dataBuffer.slice(this._dataBuffer.length - (EXPECT_MAX_BUFFER_SIZE - data.length));
    }

    this._dataBuffer = Buffer.concat([this._dataBuffer, data]);
    var index = this._dataBuffer.indexOf(this._marker);

    if (index !== -1) {
        clearTimeout(this._timer);
        index += this._marker.length;
        this._dataBuffer = this._dataBuffer.slice(index);
        this._callback(undefined, this._dataBuffer);
    }
};

module.exports = Expect;
