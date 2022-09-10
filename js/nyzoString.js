class NyzoStringPrivateSeed {

    constructor(seed) {
        this.seed = seed;
    }

    getSeed() {
        return this.seed;
    }
}

class NyzoStringPublicIdentifier {

    constructor(identifier) {
        this.identifier = identifier;
    }

    getIdentifier() {
        return this.identifier;
    }
}

class NyzoStringPrefilledData {

    constructor(receiverIdentifier, senderData) {
        this.receiverIdentifier = receiverIdentifier;
        this.senderData = senderData;
    }

    getReceiverIdentifier() {
        return this.receiverIdentifier;
    }

    getSenderData() {
        return this.senderData;
    }
}

var characterLookup = ('0123456789' +
            'abcdefghijkmnopqrstuvwxyz' +
            'ABCDEFGHIJKLMNPQRSTUVWXYZ' +
            '-.~_').split('');

var characterToValueMap = [];
for (var i = 0; i < characterLookup.length; i++) {
    characterToValueMap[characterLookup[i]] = i;
}

function arraysAreEqual(array1, array2) {

    var arraysAreEqual;
    if (array1 == null || array2 == null) {
        arraysAreEqual = array1 == null && array2 == null;
    } else {
        arraysAreEqual = array1.length == array2.length;
            for (var i = 0; i < array1.length && arraysAreEqual; i++) {
                if (array1[i] != array2[i]) {
                    arraysAreEqual = false;
                }
            }
        }

        return arraysAreEqual;
    }

function decode(encodedString) {

    var result = null;

    // Map characters from the old encoding to the new encoding. A few characters were changed to make Nyzo strings more
    // URL-friendly.
    encodedString = encodedString.replace(/\*/g, '-').replace(/\+/g, '.').replace(/=/g, '~');

    // Map characters that may be mistyped. Nyzo strings contain neither 'l' nor 'O'.
    encodedString = encodedString.replace(/l/g, '1').replace(/O/g, '0');

    // Get the type from the prefix.
    var prefix = encodedString.substring(0, 4);

    // Get the array representation of the encoded string.
    var expandedArray = byteArrayForEncodedString(encodedString);

    // Get the content length from the next byte and calculate the checksum length.
    var contentLength = expandedArray[3] & 0xff;
    var checksumLength = expandedArray.length - contentLength - 4;

    // Only continue if the checksum length is valid.
    if (checksumLength >= 4 && checksumLength <= 6) {

        // Calculate the checksum and compare it to the provided checksum. Only create the result array if the checksums
        // match.
        var headerLength = 4;
        var calculatedChecksum = doubleSha256(expandedArray.subarray(0, headerLength +
            contentLength)).subarray(0, checksumLength);
        var providedChecksum = expandedArray.subarray(expandedArray.length - checksumLength, expandedArray.length);

        if (arraysAreEqual(calculatedChecksum, providedChecksum)) {

            // Get the content array. This is the encoded object with the prefix, length byte, and checksum removed.
            var contentBytes = expandedArray.subarray(headerLength, expandedArray.length - checksumLength);

            // Make the object from the content array.
            if (prefix === 'key_') {
                result = new NyzoStringPrivateSeed(contentBytes);
            } else if (prefix === 'id__') {
                result = new NyzoStringPublicIdentifier(contentBytes);
            } else if (prefix === 'pre_') {
                result = new NyzoStringPrefilledData(contentBytes.subarray(0, 32),
                    contentBytes.subarray(33, contentBytes.length));
            } else if (prefix === 'tx__') {
                result = Transaction.fromBytes(contentBytes);
            }
        }
    }

    return result;
}

function byteArrayForEncodedString(encodedString) {

    var arrayLength = (encodedString.length * 6 + 7) / 8;
    var array = new Uint8Array(arrayLength);
    for (var i = 0; i < arrayLength; i++) {

        var leftCharacter = encodedString.charAt(i * 8 / 6);
        var rightCharacter = encodedString.charAt(i * 8 / 6 + 1);

        var leftValue = characterToValueMap[leftCharacter];
        var rightValue = characterToValueMap[rightCharacter];
        var bitOffset = (i * 2) % 6;
        array[i] = ((((leftValue << 6) + rightValue) >> 4 - bitOffset) & 0xff);
    }

    return array;
}

function encodedStringForByteArray(array) {

    var index = 0;
    var bitOffset = 0;
    var encodedString = "";
    while (index < array.length) {

        // Get the current and next byte.
        var leftByte = array[index] & 0xff;
        var rightByte = index < array.length - 1 ? array[index + 1] & 0xff : 0;

        // Append the character for the next 6 bits in the array.
        var lookupIndex = (((leftByte << 8) + rightByte) >> (10 - bitOffset)) & 0x3f;
        encodedString += characterLookup[lookupIndex];

        // Advance forward 6 bits.
        if (bitOffset == 0) {
            bitOffset = 6;
        } else {
            index++;
            bitOffset -= 2;
        }
    }

    return encodedString;
}

function encodeNyzoString(prefix, contentBytes) {
    // Get the prefix array from the type.
    var prefixBytes = byteArrayForEncodedString(prefix);

    // Determine the length of the expanded array with the header and the checksum. The header is the type-specific
    // prefix in characters followed by a single byte that indicates the length of the content array (four bytes
    // total). The checksum is a minimum of 4 bytes and a maximum of 6 bytes, widening the expanded array so that
    // its length is divisible by 3.
    var checksumLength = 4 + (3 - (contentBytes.length + 2) % 3) % 3;
    var expandedLength = 4 + contentBytes.length + checksumLength;

    // Create the array and add the header and the content. The first three bytes turn into the user-readable
    // prefix in the encoded string. The next byte specifies the length of the content array, and it is immediately
    // followed by the content array.
    var expandedArray = new Uint8Array(expandedLength);
    for (var i = 0; i < prefixBytes.length; i++) {
        expandedArray[i] = prefixBytes[i];
    }
    expandedArray[3] = contentBytes.length;
    for (var i = 0; i < contentBytes.length; i++) {
        expandedArray[i + 4] = contentBytes[i];
    }

    // Compute the checksum and add the appropriate number of bytes to the end of the array.
    var checksum = doubleSha256(expandedArray.subarray(0, 4 + contentBytes.length));
    for (var i = 0; i < checksumLength; i++) {
        expandedArray[expandedArray.length - checksumLength + i] = checksum[i];
    }

    // Build and return the encoded string from the expanded array.
    return encodedStringForByteArray(expandedArray);
}

function nyzoStringFromPrivateKey(byteArray) {
    return encodeNyzoString('key_', byteArray);
}

function nyzoStringFromPublicIdentifier(byteArray) {
    return encodeNyzoString('id__', byteArray);
}

function nyzoStringFromTransaction(byteArray) {
    return encodeNyzoString('tx__', byteArray);
}