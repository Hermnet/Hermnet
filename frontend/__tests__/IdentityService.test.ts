import { IdentityService } from '../services/IdentityService';
import QuickCrypto from '../services/CryptoService';

/**
 * These tests exercise the REAL cryptography, not mocks. Under Jest the native
 * react-native-quick-crypto module is unavailable, so CryptoService transparently
 * falls back to node-forge — the same primitives (RSA-2048, SHA-256, RSA-SHA256
 * sign/verify) the app relies on. A regression here would silently corrupt every
 * user's identity or make messages undecryptable, so it is worth locking down.
 */
describe('IdentityService (real crypto)', () => {
    const service = new IdentityService();

    // RSA-2048 key generation via the forge fallback is CPU-heavy, so we generate
    // a single identity once and reuse it across the sign/verify assertions.
    let identity: ReturnType<IdentityService['generateIdentity']>;

    beforeAll(() => {
        identity = service.generateIdentity();
    }, 30000);

    it('derives a HNET id that is the SHA-256 fingerprint of the public key', () => {
        expect(identity.id).toMatch(/^HNET-[0-9A-F]{16}$/);

        const expectedFingerprint = QuickCrypto
            .createHash('sha256')
            .update(identity.publicKey)
            .digest('hex')
            .toString()
            .substring(0, 16)
            .toUpperCase();

        expect(identity.id).toBe(`HNET-${expectedFingerprint}`);
    });

    it('produces PEM-encoded public and private keys', () => {
        expect(identity.publicKey).toContain('BEGIN PUBLIC KEY');
        expect(identity.privateKey).toContain('BEGIN PRIVATE KEY');
    });

    it('verifies a signature produced by the matching private key', () => {
        const nonce = 'a1b2c3d4e5f6-challenge-nonce';
        const signature = service.signNonce(identity.privateKey, nonce);

        expect(typeof signature).toBe('string');
        expect(signature.length).toBeGreaterThan(0);
        expect(service.verifySignature(identity.publicKey, nonce, signature)).toBe(true);
    });

    it('rejects a signature when the signed data has been tampered with', () => {
        const nonce = 'original-nonce';
        const signature = service.signNonce(identity.privateKey, nonce);

        expect(service.verifySignature(identity.publicKey, 'tampered-nonce', signature)).toBe(false);
    });

    it('returns false instead of throwing on a malformed signature', () => {
        expect(service.verifySignature(identity.publicKey, 'nonce', 'not-base64-!!')).toBe(false);
    });
});
