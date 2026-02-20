const HEADER_BYTES = 4;
const DEFAULT_SENTINEL = new Uint8Array([0xff, 0xfe]);

export interface EmbedOptions {
  addNoisePadding?: boolean;
  sentinel?: Uint8Array;
}

/**
 * Service responsible for payload hiding/recovery using LSB over RGBA pixels.
 *
 * The implementation writes bits only into RGB channels and skips Alpha.
 */
export class SteganographyService {
  /**
   * Converts UTF-8 ciphertext text to bytes for steganographic embedding.
   */
  ciphertextToBytes(ciphertext: string): Uint8Array {
    return new TextEncoder().encode(ciphertext);
  }

  /**
   * Converts extracted bytes to UTF-8 ciphertext text.
   */
  bytesToCiphertext(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }

  /**
   * Returns usable payload capacity (in bytes) for a given RGBA container.
   */
  getPayloadCapacityBytes(containerRgba: Uint8ClampedArray): number {
    const usableChannels = this.getUsableChannels(containerRgba.length);
    const usableBytes = Math.floor(usableChannels / 8);
    const overheadBytes = HEADER_BYTES + DEFAULT_SENTINEL.length;

    return Math.max(0, usableBytes - overheadBytes);
  }

  /**
   * Embeds payload bytes inside an RGBA container using LSB over RGB channels.
   */
  embedPayload(
    containerRgba: Uint8ClampedArray,
    payload: Uint8Array,
    options: EmbedOptions = {}
  ): Uint8ClampedArray {
    const sentinel = options.sentinel ?? DEFAULT_SENTINEL;
    const capacity = this.getPayloadCapacityBytesWithSentinel(containerRgba, sentinel);

    if (payload.length > capacity) {
      throw new Error('Payload exceeds image capacity for LSB embedding');
    }

    const output = new Uint8ClampedArray(containerRgba);
    const header = this.intToBytes(payload.length);
    const stream = this.concatBytes(header, payload, sentinel);
    const bits = this.bytesToBits(stream);

    let bitIndex = 0;
    for (let pixelIndex = 0; pixelIndex < output.length && bitIndex < bits.length; pixelIndex++) {
      if (this.isAlphaChannel(pixelIndex)) {
        continue;
      }

      output[pixelIndex] = (output[pixelIndex] & 0xfe) | bits[bitIndex];
      bitIndex++;
    }

    if (options.addNoisePadding) {
      for (let pixelIndex = 0; pixelIndex < output.length; pixelIndex++) {
        if (this.isAlphaChannel(pixelIndex)) {
          continue;
        }

        if (bitIndex < this.getUsableChannels(output.length)) {
          output[pixelIndex] = (output[pixelIndex] & 0xfe) | this.randomBit();
          bitIndex++;
        }
      }
    }

    return output;
  }

  /**
   * Extracts payload bytes from an RGBA container using LSB over RGB channels.
   */
  extractPayload(
    containerRgba: Uint8ClampedArray,
    sentinel: Uint8Array = DEFAULT_SENTINEL
  ): Uint8Array {
    const channels = this.readLsbChannels(containerRgba);

    const payloadLength = this.bytesToInt(this.bitsToBytes(channels.slice(0, HEADER_BYTES * 8)));
    const payloadBitStart = HEADER_BYTES * 8;
    const payloadBitEnd = payloadBitStart + payloadLength * 8;
    const sentinelBitEnd = payloadBitEnd + sentinel.length * 8;

    if (sentinelBitEnd > channels.length) {
      throw new Error('Container does not include enough bits for declared payload length');
    }

    const payloadBytes = this.bitsToBytes(channels.slice(payloadBitStart, payloadBitEnd));
    const extractedSentinel = this.bitsToBytes(channels.slice(payloadBitEnd, sentinelBitEnd));

    if (!this.byteArraysEqual(extractedSentinel, sentinel)) {
      throw new Error('Invalid sentinel detected while extracting payload');
    }

    return payloadBytes;
  }

  private getPayloadCapacityBytesWithSentinel(containerRgba: Uint8ClampedArray, sentinel: Uint8Array): number {
    const usableChannels = this.getUsableChannels(containerRgba.length);
    const usableBytes = Math.floor(usableChannels / 8);
    const overheadBytes = HEADER_BYTES + sentinel.length;
    return Math.max(0, usableBytes - overheadBytes);
  }

  private getUsableChannels(rgbaLength: number): number {
    const pixels = Math.floor(rgbaLength / 4);
    return pixels * 3;
  }

  private isAlphaChannel(channelIndex: number): boolean {
    return (channelIndex + 1) % 4 === 0;
  }

  private intToBytes(value: number): Uint8Array {
    return new Uint8Array([
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    ]);
  }

  private bytesToInt(bytes: Uint8Array): number {
    if (bytes.length !== 4) {
      throw new Error('Header must contain exactly 4 bytes');
    }

    return (
      ((bytes[0] << 24) >>> 0) |
      (bytes[1] << 16) |
      (bytes[2] << 8) |
      bytes[3]
    );
  }

  private concatBytes(...parts: Uint8Array[]): Uint8Array {
    const size = parts.reduce((acc, current) => acc + current.length, 0);
    const result = new Uint8Array(size);
    let offset = 0;

    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }

    return result;
  }

  private bytesToBits(bytes: Uint8Array): number[] {
    const bits: number[] = [];
    for (const value of bytes) {
      for (let bit = 7; bit >= 0; bit--) {
        bits.push((value >> bit) & 1);
      }
    }
    return bits;
  }

  private bitsToBytes(bits: number[]): Uint8Array {
    const byteCount = Math.floor(bits.length / 8);
    const bytes = new Uint8Array(byteCount);

    for (let index = 0; index < byteCount; index++) {
      let value = 0;
      for (let bit = 0; bit < 8; bit++) {
        value = (value << 1) | bits[index * 8 + bit];
      }
      bytes[index] = value;
    }

    return bytes;
  }

  private readLsbChannels(containerRgba: Uint8ClampedArray): number[] {
    const bits: number[] = [];

    for (let channelIndex = 0; channelIndex < containerRgba.length; channelIndex++) {
      if (this.isAlphaChannel(channelIndex)) {
        continue;
      }

      bits.push(containerRgba[channelIndex] & 1);
    }

    return bits;
  }

  private byteArraysEqual(left: Uint8Array, right: Uint8Array): boolean {
    if (left.length !== right.length) {
      return false;
    }

    for (let i = 0; i < left.length; i++) {
      if (left[i] !== right[i]) {
        return false;
      }
    }

    return true;
  }

  private randomBit(): number {
    return Math.random() >= 0.5 ? 1 : 0;
  }
}

export const steganographyService = new SteganographyService();
