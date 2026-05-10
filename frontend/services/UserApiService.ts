import { apiClient } from './ApiClient';

export interface PublicUserDto {
  id: string;
  publicKey: string;
  createdAt: string;
}

export class UserApiService {
  async findById(id: string): Promise<PublicUserDto> {
    return apiClient.request<PublicUserDto>({
      path: `/api/users/${encodeURIComponent(id)}`,
      method: 'GET',
    });
  }

  async updatePushToken(pushToken: string | null): Promise<void> {
    await apiClient.request<void>({
      path: '/api/users/me/push-token',
      method: 'PUT',
      body: { pushToken },
    });
  }
}

export const userApiService = new UserApiService();
