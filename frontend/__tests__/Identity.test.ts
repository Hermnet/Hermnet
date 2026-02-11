import { identityService } from '../services/IdentityService';

describe('IdentityService', () => {
    it('should generate a valid identity with HNET- prefix', () => {
        const identity = identityService.generateIdentity();

        // Check for the correct prefix
        expect(identity.id).toMatch(/^HNET-/);

        // Check that the ID has the expected length
        expect(identity.id.length).toBe(21);

        // Ensure keys are generated
        expect(identity.publicKey).toBeDefined();
        expect(identity.privateKey).toBeDefined();
        expect(typeof identity.publicKey).toBe('string');
    });
});