'use strict';

const genesisBlockHash = hexStringAsUint8Array('bc4cca2a2a50a229-256ae3f5b2b5cd49-aa1df1e2d0192726-c4bb41cdcea15364');
const micronyzosPerNyzo = 1000000;

function hexStringAsUint8Array(identifier) {

    identifier = identifier.split('-').join('');

    let array = new Uint8Array(identifier.length / 2);
    for (let i = 0; i < array.length; i++) {
        array[i] = parseInt(identifier.substring(i * 2, i * 2 + 2), 16);
    }

    return array;
}

function uint8ArrayAsHexString(buffer, includeDashes, includeExtraBreaks) {
    let result = '';
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] < 16) {
            result += '0';
        }
        result += buffer[i].toString(16);
        if ((includeDashes || includeExtraBreaks) && i % 8 == 7 && i < buffer.length - 1) {
            if (includeDashes) {
                result += '-';
            } else {
                result += '<wbr>';
            }
        } else if (includeExtraBreaks && i % 8 == 3 && i < buffer.length - 1) {
            result += '<wbr>';
        }
    }

    return result;
}

function publicIdentifierStringForString(string) {

    // If this is a valid Nyzo public identifier string, that value is returned. Otherwise, if the value can be
    // interpreted as a raw hex public identifier, the equivalent Nyzo public identifier string is returned.
    let result = null;
    if (isValidPublicIdentifier(string)) {
        result = string;
    } else {
        try {
            result = nyzoStringFromPublicIdentifier(hexStringAsUint8Array(string));
        } catch (error) { }
    }

    return result;
}

function sha256Uint8(array) {
    let ascii = '';
    for (let i = 0; i < array.length; i++) {
        ascii += String.fromCharCode(array[i]);
    }

    return hexStringAsUint8Array(sha256(ascii));
}

function doubleSha256(array) {

    return sha256Uint8(sha256Uint8(array));
}

function stringAsUint8Array(string) {

    let encodedString = unescape(encodeURIComponent(string));

    let array = new Uint8Array(encodedString.length);
    for (let i = 0; i < encodedString.length; i++) {
        array[i] = encodedString.charCodeAt(i);
    }

    return array;
}

function isValidPrivateKey(keyString) {
    let valid = false;
    if (typeof keyString === 'string') {
        keyString = keyString.trim();
        let key = decode(keyString);
        valid = key != null && typeof key.getSeed() !== 'undefined';
    }

    return valid;
}

function isValidPublicIdentifier(identifierString) {
    let valid = false;
    if (typeof identifierString === 'string') {
        identifierString = identifierString.trim();
        let identifier = decode(identifierString);
        valid = identifier != null && typeof identifier.getIdentifier() !== 'undefined';
    }

    return valid;
}

function getAmountMicronyzos(valueString) {
    return Math.floor(+valueString * micronyzosPerNyzo);
}

function isDefined(value) {
    return !isUndefined(value);
}

function isUndefined(value) {
    return value === void(0);
}