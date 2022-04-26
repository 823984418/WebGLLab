/**
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 * @return {Promise<string>}
 */
export async function fetchText(input, init) {
    let response = await fetch(input, init);
    return await response.text();
}

/**
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 * @return {Promise<Blob>}
 */
export async function fetchBlob(input, init) {
    let response = await fetch(input, init);
    return await response.blob();
}

/**
 * @param {string} url
 * @return {Promise<Image>}
 */
export async function loadImage(url) {
    let image = new Image();
    /**
     * @type {Promise<Image>}
     */
    let promise = new Promise(resolve => {
        let listener = event => {
            resolve(image);
            image.removeEventListener("load", listener);
        };
        image.addEventListener("load", listener);
    });
    image.src = url;
    return await promise;
}

export class DataViewEx extends DataView {
    constructor(buffer, byteOffset, byteLength) {
        super(buffer, byteOffset, byteLength);
        this.defaultDecoder = new TextDecoder();
        this.defaultEncoder = new TextEncoder();
    }

    defaultDecoder;
    defaultEncoder;

    /**
     * @param {number} [byteOffset]
     * @param {number} [byteLength]
     * @return {Uint8Array}
     */
    subUint8Array(byteOffset, byteLength) {
        if (byteOffset == null) {
            byteOffset = 0;
        }
        let offset = this.byteOffset + byteOffset;
        if (byteLength == null) {
            byteLength = this.byteLength - offset;
        }
        if (offset + byteLength > this.byteLength) {
            throw new Error();
        }
        return new Uint8Array(this.buffer, offset, byteLength);
    }

    /**
     * @param {number} byteOffset
     * @param {number} byteLength
     * @param {TextDecoder} [decoder]
     */
    getText(byteOffset, byteLength, decoder) {
        if (decoder == null) {
            decoder = this.defaultDecoder;
        }
        return decoder.decode(this.subUint8Array(byteOffset, byteLength));
    }

    /**
     * @param {number} byteOffset
     * @param {string} text
     * @param {number} [maxLength]
     * @param {TextEncoder} [encoder]
     * @return {number}
     */
    setText(byteOffset, text, maxLength, encoder) {
        if (encoder == null) {
            encoder = this.defaultEncoder;
        }
        let data = encoder.encode(text);
        this.subUint8Array(byteOffset, maxLength).set(data);
        return data.length;
    }

}
