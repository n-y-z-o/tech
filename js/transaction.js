class Transaction {

    constructor() {
        this.timestamp = Date.now();
        this.type = 2;
        this.amount = 0;
        this.recipientIdentifier = new Uint8Array(32);
        this.previousHashHeight = 0;
        this.previousBlockHash = new Uint8Array(32);
        this.senderIdentifier = new Uint8Array(32);
        this.senderData = new Uint8Array(0);
        this.signature = new Uint8Array(64);
    }

    setTimestamp(timestamp) {
        this.timestamp = timestamp;
    }

    setAmount(amount) {
        this.amount = amount;
    }

    setRecipientIdentifier(recipientIdentifier) {
        for (let i = 0; i < 32; i++) {
            this.recipientIdentifier[i] = recipientIdentifier[i];
        }
    }

    setPreviousHashHeight(previousHashHeight) {
        this.previousHashHeight = previousHashHeight;
    }

    setPreviousBlockHash(previousBlockHash) {
        for (let i = 0; i < 32; i++) {
            this.previousBlockHash[i] = previousBlockHash[i];
        }
    }

    setSenderIdentifier(senderIdentifier) {
        for (let i = 0; i < 32; i++) {
            this.senderIdentifier[i] = senderIdentifier[i];
        }
    }

    setSenderData(senderData) {
        this.senderData = new Uint8Array(Math.min(senderData.length, 32));
        for (let i = 0; i < this.senderData.length; i++) {
            this.senderData[i] = senderData[i];
        }
    }

    setSignature(signature) {
        for (let i = 0; i < 64; i++) {
            this.signature[i] = signature[i];
        }
    }

    sign(seedBytes) {
        var keyPair = nacl.sign.keyPair.fromSeed(seedBytes);
        for (var i = 0; i < 32; i++) {
            this.senderIdentifier[i] = keyPair.publicKey[i];
        }

        var signature = nacl.sign.detached(this.getBytes(false), keyPair.secretKey);
        for (var i = 0; i < 64; i++) {
            this.signature[i] = signature[i];
        }
    }

    getBytes(includeSignature) {

        var forSigning = !includeSignature;

        var buffer = new ByteBuffer(1000);

        buffer.putByte(2);  // transaction type = 2 (standard)
        buffer.putLong(this.timestamp);
        buffer.putLong(this.amount);
        buffer.putBytes(this.recipientIdentifier);

        if (forSigning) {
            buffer.putBytes(this.previousBlockHash);
        } else {
            buffer.putLong(this.previousHashHeight);
        }
        buffer.putBytes(this.senderIdentifier);

        if (forSigning) {
            buffer.putBytes(doubleSha256(this.senderData));
        } else {
            buffer.putByte(this.senderData.length);
            buffer.putBytes(this.senderData);
        }

        if (!forSigning) {
            buffer.putBytes(this.signature);
        }

        return buffer.toArray();
    }

    static fromBytes(array) {
        const buffer = new ByteBuffer();
        buffer.initializeWithArray(array);

        const transaction = new Transaction();
        transaction.type = buffer.readByte();
        transaction.setTimestamp(buffer.readLong());
        transaction.setAmount(buffer.readLong());
        transaction.setRecipientIdentifier(buffer.readBytes(32));
        transaction.setPreviousHashHeight(buffer.readLong());
        transaction.setSenderIdentifier(buffer.readBytes(32));
        const dataLength = buffer.readByte();
        transaction.setSenderData(buffer.readBytes(dataLength));
        transaction.setSignature(buffer.readBytes(64));

        return transaction;
    }
}

// This section is for tests to ensure the class performs as expected. If a testFunctions list is defined, all test
// functions will be added to it for running after all scripts are loaded.

function testTransaction() {

    // This is a transaction that was incorporated into block 18004177.
    const transactionString = 'tx__Lx800063a2wrMx0000000002Spd0_B.4dxBZV-kqK2uV_b5MxWkhL4FW35ivZq_ZvQp0000000000efadk' +
        'MnZ~tyu.M9cAuND.wQdu5B7I.Qz7CDqRizdqnI83~4A~8A~cBggBzcBScC64C68Cp0CH0CZ-DdWDwSDPNxrFzdIvMQPC0UrRXbN~xHyHG-kT' +
        '4N8U2m3Rvu.rae_TFyc-CevWFtY-mRGvdUhsGy0h6Ez.rBrq1tj~-Lf7gY1HvknQPK';

    // Decode the transaction.
    const transaction = decode(transactionString);
    const functionTag = 'transaction.js:testTransaction()';
    if (transaction == null) {
        console.warn('unable to decode transaction in ' + functionTag);
    }

    // Check the values against expected values for this particular transaction.
    check(transaction.timestamp, 1662826044094, functionTag + ':timestamp');
    check(transaction.type, 2, functionTag + ':type');
    check(transaction.amount, 2, functionTag + ':amount');
    check(transaction.recipientIdentifier, 'd18340fe4f443609-3bdfc519b42777fc-b16f838511b84a38-0c549eed9ffb7b26',
        functionTag + ':recipientIdentifier');
    check(transaction.previousHashHeight, 0, functionTag + ':previousHashHeight');
    check(transaction.previousBlockHash, '0000000000000000-0000000000000000-0000000000000000-0000000000000000',
        functionTag + ':previousBlockHash');
    check(transaction.senderIdentifier, 'e3ca354bd6efe721-77dbc93237709bd7-f235d1641ebf7288-79666734a23595ab',
        functionTag + ':senderIdentifier');
    check(transaction.senderData, '3f848fe223f8c910-42488c9343251849-4622560096a025ef-c98de267f49b1c20',
        functionTag + ':senderData');
    check(transaction.signature, '6a888dadebf2c650-366b3e4bc3e82a86-aa7c535130236095-0f379df5a28eff5a-' +
        '2133c94e7b8a1ceb-c573a5e37645ba61-0111a78bd6a46990-5c4fef2e3c743a06', functionTag + ':signature');
}

function check(expectedValue, actualValue, tag) {
    // If the expected value is a Uint8Array, convert it to a hex string with dashes.
    if (expectedValue instanceof Uint8Array) {
        expectedValue = uint8ArrayAsHexString(expectedValue, true);
    }

    if (expectedValue !== actualValue) {
        console.warn(tag + ': ' + expectedValue + '!==' + actualValue);
    }
}

if (typeof testFunctions !== 'undefined' && typeof testFunctions.push === 'function') {
    testFunctions.push(testTransaction);
}