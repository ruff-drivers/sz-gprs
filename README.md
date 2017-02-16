[![Build Status](https://travis-ci.org/ruff-drivers/sz-gprs.svg)](https://travis-ci.org/ruff-drivers/sz-gprs)

# sz-gprs module Driver for Ruff

The gprs module driver.

## Supported Engines

* Ruff: >=1.7.0 <2.0.0
* RuffLite: >=0.7.2 <1.0.0

## Supported Models

- [sz11-01](https://rap.ruff.io/devices/sz11-01)

## Installing

Execute following command and enter a **supported model** to install.

```sh
# Please replace `<device-id>` with a proper ID.
# And this will be what you are going to query while `$('#<device-id>')`.
rap device add <device-id>

# Then enter a supported model, for example:
# ? model: sz11-01
```

## Usage

Here is the basic usage of this driver.

```js
var sendData = 'hello world!';
$('#<device-id>').on('data', function (data) {
    console.log('data from server is ', data);
});
$('#<device-id>').powerOn(function (error) {
    if (error) {
        console.log(error);
        return;
    }
    $('#<device-id>').setConfig(config, function (error) {
        if (error) {
            console.log(error);
            return;
        }
        $('#<device-id>').setDataMode(function (error) {
            if (error) {
                console.log(error);
                return;
            }
            $('#<device-id>').send(sendData, function (error) {
                if (error) {
                    console.log(error);
                    return;
                }
                console.log('send data to server done.');
            });
        });
    });
});
```

## API References

### Methods

#### `powerOn([callback])`

Power on the gprs module.

- **callback:** No arguments other than a possible exception are given to the completion callback.

#### `powerOff([callback])`

Power off the gprs module.

- **callback:** No arguments other than a possible exception are given to the completion callback.

#### `setConfig(options[, callback])`

Set some configuration to the gprs module.

- **options:** Configurations to be set to the gprs module.
  - **gNod:** The `APN` name of telecommunication provider. `CMNET` for China Mobile, and `UNINET` for China Unicom.
  - **pAddr:** The ip address of the primary remote server.
  - **pPort:** The port number of the primary remote server.
  - **heartTime:** The interval of sending the heartbeat data to the remote server. The unit of this value is seconed, and its range is [0, 65535].
  When this value is 0, the heartbeat data is not send.
  - **heartData:** The content of heartbeat data, the maximum length of data is 82 bytes.
  - **regEnable:** Optional field. This value is boolean, when it is true, the register data will be sent to the remote server when the gprs module is connected to mobile network.
  - **regData:** Optional field. The register data sent to the remote server when **regEnable** is true, the maximum length of the data is 82 bytes.
- **callback:** No arguments other than a possible exception are given to the completion callback.

#### `setDataMode([callback])`

Set the gprs module to data mode, then the `send` method can be invoked to communicate with the remote server.

- **callback:** No arguments other than a possible exception are given to the completion callback.

#### `send(data[, callback])`

Send data, which would be encode by this module, to the remote server.

Format of data send to the server is as follows:

```
---------------------------------------------------------
|   head    |   length  |   crc16   |   body    | tail  |
---------------------------------------------------------
|   2Byte   |   2Byte   |   2Byte   |   n byte  | 2Byte |
---------------------------------------------------------
```

Server should decode received data according this format and get the `body` part as the valid data.

### Events

#### `data`

Eimtted when valid data received from the remote server.

## Contributing

Contributions to this project are warmly welcome. But before you open a pull request, please make sure your changes are passing code linting and tests.

You will need the latest [Ruff SDK](https://ruff.io/) to install rap dependencies and then to run tests.

### Installing Dependencies

```sh
npm install
rap install
```

### Running Tests

```sh
npm test
```

## License

The MIT License (MIT)

Copyright (c) 2016 Nanchao Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
