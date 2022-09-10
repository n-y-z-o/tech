class Transaction {

    constructor() {
        this.timestamp = Date.now();
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
        for (var i = 0; i < 32; i++) {
            this.recipientIdentifier[i] = recipientIdentifier[i];
        }
    }

    setPreviousHashHeight(previousHashHeight) {
        this.previousHashHeight = previousHashHeight;
    }

    setPreviousBlockHash(previousBlockHash) {
        for (var i = 0; i < 32; i++) {
            this.previousBlockHash[i] = previousBlockHash[i];
        }
    }

    setSenderData(senderData) {
        this.senderData = new Uint8Array(Math.min(senderData.length, 32));
        for (var i = 0; i < this.senderData.length; i++) {
            this.senderData[i] = senderData[i];
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
        buffer.readShort();
        transaction.setTimestamp(buffer.readLong());
        transaction.setAmount(buffer.readLong);
        transaction.setRecipientIdentifier(buffer.readBytes(32));
        transaction.setPreviousHashHeight(buffer.readLong());
        const dataLength = buffer.readByte();
        transaction.setSenderData(buffer.readBytes(dataLength));
        transaction.signature = buffer.readBytes(64);

        return transaction;
    }
}