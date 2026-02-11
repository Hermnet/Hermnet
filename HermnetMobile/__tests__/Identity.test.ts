import { identityService } from '../services/IdentityService';

describe('IdentityService', () => {
    it('should generate a valid identity with HNET- prefix', () => {
        const identity = identityService.generateIdentity();

        expect(identity.id).toMatch(/^HNET-/);

        expect(identity.id.length).toBe(21);

        expect(identity.publicKey).toBeDefined();
        expect(identity.privateKey).toBeDefined();
        expect(typeof identity.publicKey).toBe('string');
    });
});