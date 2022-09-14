class ByteBuffer {

    constructor(maximumSize) {
        this.index = 0;
        this.array = new Uint8Array(Math.max(maximumSize, 1));
    }

    initializeWithArray(bytes) {
        this.index = 0;
        this.array = bytes;
    }

    putBytes(bytes) {
        for (let i = 0; i < bytes.length; i++) {
            this.array[this.index++] = bytes[i];
        }
    }

    putByte(byte) {
        this.array[this.index++] = byte;
    }

    putIntegerValue(value, length) {
        value = Math.floor(value);
        for (let i = 0; i < length; i++) {
            this.array[this.index + length - 1 - i] = value % 256;
            value = Math.floor(value / 256);
        }
        this.index += length;
    }

    putShort(value) {
        this.putIntegerValue(value, 2);
    }

    putInt(value) {
        this.putIntegerValue(value, 4);
    }

    putLong(value) {
        this.putIntegerValue(value, 8);
    }

    toArray() {
        let result = new Uint8Array(this.index);
        for (let i = 0; i < this.index; i++) {
            result[i] = this.array[i];
        }

        return result;
    }

    readBytes(length) {
        const result = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.array[this.index++];
        }

        return result;
    }

    readByte() {
        return this.array[this.index++];
    }

    readIntegerValue(length) {
        let result = 0;
        for (let i = 0; i < length; i++) {
            result *= 256;
            result += this.array[this.index + i];
        }
        this.index += length;

        return result;
    }

    readShort() {
        return this.readIntegerValue(2);
    }

    readInt() {
        return this.readIntegerValue(4);
    }

    readLong() {
        return this.readIntegerValue(8);
    }
}