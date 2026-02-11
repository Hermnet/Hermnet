import QuickCrypto from "react-native-quick-crypto";

export interface Identity {
    id: string;
    publicKey: string;
    privateKey: string;
}

export class IdentityService {
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