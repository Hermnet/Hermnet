jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => ({})),
  },
}));

import QuickCrypto from "react-native-quick-crypto";

describe('QuickCrypto Native Bridge', () => {
    it('should generate a valid SHA-256 hash', () => {
        const data = 'HermnetSecretMessage';
        const hash = QuickCrypto.createHash('sha256').update(data).digest('hex');

        expect(hash).toHaveLength(64);
        expect(typeof hash).toBe('string');
    });
});