import { AuthFlowService } from '../services/AuthFlowService';
import { authApiService } from '../services/AuthApiService';
import { authSessionService } from '../services/AuthSessionService';
import { identityService } from '../services/IdentityService';

jest.mock('../services/AuthApiService', () => ({
  authApiService: {
    register: jest.fn(),
    challenge: jest.fn(),
    login: jest.fn(),
  },
}));

jest.mock('../services/AuthSessionService', () => ({
  authSessionService: {
    getIdentity: jest.fn(),
    setIdentity: jest.fn(),
    getJwtToken: jest.fn(),
    setJwtToken: jest.fn(),
  },
}));

jest.mock('../services/IdentityService', () => ({
  identityService: {
    generateIdentity: jest.fn(),
    signNonce: jest.fn(),
  },
}));

describe('AuthFlowService', () => {
  const mockIdentity = {
    id: 'HNET-ABCDEF1234567890',
    publicKey: 'public-key',
    privateKey: 'private-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (authSessionService.getJwtToken as jest.Mock).mockResolvedValue(null);
  });

  it('should register identity on first use and then login through challenge flow', async () => {
    (authSessionService.getIdentity as jest.Mock).mockResolvedValue(null);
    (identityService.generateIdentity as jest.Mock).mockReturnValue(mockIdentity);
    (authApiService.register as jest.Mock).mockResolvedValue({});
    (authApiService.challenge as jest.Mock).mockResolvedValue({ nonce: 'nonce-123' });
    (identityService.signNonce as jest.Mock).mockReturnValue('signed-nonce');
    (authApiService.login as jest.Mock).mockResolvedValue({ token: 'jwt-token' });

    const service = new AuthFlowService();
    const result = await service.bootstrapLogin();

    expect(authApiService.register).toHaveBeenCalledWith({
      id: mockIdentity.id,
      publicKey: mockIdentity.publicKey,
    });
    expect(authApiService.challenge).toHaveBeenCalledWith({ userId: mockIdentity.id });
    expect(identityService.signNonce).toHaveBeenCalledWith(mockIdentity.privateKey, 'nonce-123');
    expect(authApiService.login).toHaveBeenCalledWith({
      nonce: 'nonce-123',
      signedNonce: 'signed-nonce',
    });
    expect(authSessionService.setJwtToken).toHaveBeenCalledWith('jwt-token');
    expect(result.registeredInThisSession).toBe(true);
  });

  it('should skip register when identity already exists', async () => {
    (authSessionService.getIdentity as jest.Mock).mockResolvedValue(mockIdentity);
    (authApiService.challenge as jest.Mock).mockResolvedValue({ nonce: 'nonce-456' });
    (identityService.signNonce as jest.Mock).mockReturnValue('signed-nonce-2');
    (authApiService.login as jest.Mock).mockResolvedValue({ token: 'jwt-token-2' });

    const service = new AuthFlowService();
    const result = await service.bootstrapLogin();

    expect(authApiService.register).not.toHaveBeenCalled();
    expect(authApiService.challenge).toHaveBeenCalledWith({ userId: mockIdentity.id });
    expect(authApiService.login).toHaveBeenCalled();
    expect(result.registeredInThisSession).toBe(false);
  });
});
