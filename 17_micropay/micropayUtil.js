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

function isUndefined(value) {
    return value === void(0);
}