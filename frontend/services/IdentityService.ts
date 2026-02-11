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
     * Generates a new Ed25519 key pair and assigns a unique HNET ID.
     * @returns {Identity} The generated identity object.
     */
    generateIdentity(): Identity {
        const { publicKey, privateKey } = QuickCrypto.generateKeyPairSync('ed25519', {
            publicKeyEncoding: {
                type: 'spki',
                format: 'hex' as any
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'hex' as any
            },
        }) as { publicKey: string; privateKey: string };
        const id = `HNET-${publicKey.substring(0, 16).toUpperCase()}`;

        return {
            id,
            publicKey,
            privateKey,
        }
    }
}

export const identityService = new IdentityService();