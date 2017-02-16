/*!
 * Copyright (c) 2017 Nanchao Inc.
 * All rights reserved.
 */

'use strict';
var util = require('util');
var EventEmitter = require('events');

/*
数据帧格式：
---------------------------------------------------------
|   head    |   length  |   crc16   |   Body    | tail  |
---------------------------------------------------------
|   2Byte   |   2Byte   |   2Byte   |   n byte  | 2Byte |
---------------------------------------------------------
*/

var FRAME_HEAD = Buffer.from([0xFE, 0xEF]);
var FRAME_TAIL = Buffer.from([0xF0, 0x0F]);

var frameFormat = {
    headOffset: 0,
    headSize: 2,
    crcOffset: 4,
    crcSize: 2,
    lenOffset: 2,
    lenSize: 2,
    bodyOffset: 6,
    tailSize: 2
};

function Transceiver(port) {
    EventEmitter.call(this);
    this._buffer = new Buffer(0);
    this._write = port.write.bind(port);
}

util.inherits(Transceiver, EventEmitter);

Transceiver.prototype._pack = function (data) {
    var head = FRAME_HEAD;
    var tail = FRAME_TAIL;
    var crcBuffer = new Buffer(frameFormat.crcSize);
    var crcValue = crc16(data);
    crcBuffer.writeUInt16LE(crcValue, 0);
    var lenBuffer = new Buffer(frameFormat.lenSize);
    lenBuffer.writeUInt16LE(data.length, 0);
    return Buffer.concat([head, lenBuffer, crcBuffer, data, tail]);
};

Transceiver.prototype._unpack = function (data) {
    var head = data.slice(frameFormat.headOffset, frameFormat.headSize);
    var bodyLen = data.readUIntLE(frameFormat.lenOffset, frameFormat.lenSize);
    var crcValue = data.readUIntLE(frameFormat.crcOffset, frameFormat.crcSize);
    var body = data.slice(frameFormat.bodyOffset, frameFormat.bodyOffset + bodyLen);
    if (FRAME_HEAD.compare(head) === 0 && crcValue === crc16(body)) {
        return body;
    } else {
        return null;
    }
};

Transceiver.prototype.transmit = function (data, callback) {
    var crcBuffer = new Buffer(frameFormat.crcSize);
    var crcValue = crc16(data);
    crcBuffer.writeUInt16LE(crcValue, 0);
    var lenBuffer = new Buffer(frameFormat.lenSize);
    lenBuffer.writeUInt16LE(data.length, 0);
    this._write(Buffer.concat([FRAME_HEAD, lenBuffer, crcBuffer, data, FRAME_TAIL]), callback);
};

Transceiver.prototype.feed = function (data) {
    this._buffer = Buffer.concat([this._buffer, data]);
    var start = this._buffer.indexOf(FRAME_HEAD);
    var end = this._buffer.indexOf(FRAME_TAIL);
    while (start >= 0 && end >= 0 && start < end) {
        if (start < end) {
            var unpackedData = this._unpack(this._buffer.slice(start, end + frameFormat.tailSize));
            if (unpackedData) {
                this.emit('data', unpackedData);
            }
        }
        this._buffer = this._buffer.slice(end + frameFormat.tailSize);
        start = this._buffer.indexOf(FRAME_HEAD);
        end = this._buffer.indexOf(FRAME_TAIL);
    }
};

module.exports = Transceiver;

function crc16(buffer) {
    var crc = 0xFFFF;
    var odd;
    for (var i = 0; i < buffer.length; i++) {
        crc ^= buffer.readUInt8(i);

        for (var j = 0; j < 8; j++) {
            odd = crc & 0x0001;
            crc >>= 1;
            if (odd) {
                crc ^= 0xA001;
            }
        }
    }
    return crc;
}
