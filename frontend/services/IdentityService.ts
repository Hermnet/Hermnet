import QuickCrypto from "react-native-quick-crypto";

/**
 * Interface representing a user's cryptographic identity.
 */
export interface Identity {
    id: string;
    publicKey: string;
    privateKey: string;
}

/**
 * Service to manage user identification and cryptographic key pairs.
 */
export class IdentityService {
    /**
     * Generates a key pair and assigns a deterministic HNET ID.
     * @returns {Identity} The generated identity object.
     */
    generateIdentity(): Identity {
        const { publicKey, privateKey } = QuickCrypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem' as any
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem' as any
            },
        }) as { publicKey: string; privateKey: string };
        const keyFingerprint = QuickCrypto
            .createHash('sha256')
            .update(publicKey)
            .digest('hex')
            .substring(0, 16)
            .toUpperCase();

        const id = `HNET-${keyFingerprint}`;

        return {
            id,
            publicKey,
            privateKey,
        }
    }

    /**
     * Signs a challenge nonce using the private key and returns Base64 output.
     * @param privateKey PEM encoded private key.
     * @param nonce Raw nonce string.
     * @returns Base64 encoded signature.
     */
    signNonce(privateKey: string, nonce: string): string {
        const signer = (QuickCrypto as any).createSign('RSA-SHA256');
        signer.update(nonce);
        signer.end();
        return signer.sign(privateKey, 'base64');
    }
}

export const identityService = new IdentityService();