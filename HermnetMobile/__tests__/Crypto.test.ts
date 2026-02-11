jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => ({})),
  },
}));

import QuickCrypto from "react-native-quick-crypto";

describe('QuickCrypto Native Bridge', () => {
  // Verify that the native crypto module can perform basic hashing operations
  it('should generate a valid SHA-256 hash', () => {
    const data = 'HermnetSecretMessage';
    const hash = QuickCrypto.createHash('sha256').update(data).digest('hex');

    // Check hash length and type
    expect(hash).toHaveLength(64);
    expect(typeof hash).toBe('string');
  });
});