import { steganographyService } from '../services/SteganographyService';

describe('SteganographyService', () => {
  const createContainer = (pixelCount: number): Uint8ClampedArray => {
    const rgba = new Uint8ClampedArray(pixelCount * 4);

    for (let i = 0; i < rgba.length; i += 4) {
      rgba[i] = 100;
      rgba[i + 1] = 110;
      rgba[i + 2] = 120;
      rgba[i + 3] = 255;
    }

    return rgba;
  };

  it('should embed and extract ciphertext payload correctly', () => {
    const plaintext = 'encrypted-payload-123';
    const payloadBytes = steganographyService.ciphertextToBytes(plaintext);

    const container = createContainer(500);
    const embedded = steganographyService.embedPayload(container, payloadBytes);
    const extracted = steganographyService.extractPayload(embedded);

    expect(steganographyService.bytesToCiphertext(extracted)).toBe(plaintext);
  });

  it('should preserve alpha channel values during embedding', () => {
    const payloadBytes = steganographyService.ciphertextToBytes('hello');
    const container = createContainer(300);

    const embedded = steganographyService.embedPayload(container, payloadBytes);

    for (let i = 3; i < embedded.length; i += 4) {
      expect(embedded[i]).toBe(container[i]);
    }
  });

  it('should throw if payload exceeds image capacity', () => {
    const tinyContainer = createContainer(20);
    const tooLargePayload = new Uint8Array(100);

    expect(() => {
      steganographyService.embedPayload(tinyContainer, tooLargePayload);
    }).toThrow('Payload exceeds image capacity for LSB embedding');
  });

  it('should reject extraction when sentinel is invalid', () => {
    const payloadBytes = steganographyService.ciphertextToBytes('secure-data');
    const container = createContainer(400);
    const embedded = steganographyService.embedPayload(container, payloadBytes);

    embedded[40] = (embedded[40] & 0xfe) | ((embedded[40] & 1) ^ 1);

    expect(() => {
      steganographyService.extractPayload(embedded);
    }).toThrow();
  });
});
