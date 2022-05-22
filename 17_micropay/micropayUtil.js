const genesisBlockHash = hexStringAsUint8Array('bc4cca2a2a50a229-256ae3f5b2b5cd49-aa1df1e2d0192726-c4bb41cdcea15364');
const micronyzosPerNyzo = 1000000;

function isValidPrivateKey(keyString) {
    var valid = false;
    if (typeof keyString === 'string') {
        keyString = keyString.trim();
        var key = decode(keyString);
        valid = key != null && typeof key.getSeed() !== 'undefined';
    }

    return valid;
}

function isValidPublicIdentifier(identifierString) {
    var valid = false;
    if (typeof identifierString === 'string') {
        identifierString = identifierString.trim();
        var identifier = decode(identifierString);
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