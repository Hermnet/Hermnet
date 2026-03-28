import { ApiClient, configureUnauthorizedHandler } from '../services/ApiClient';

describe('ApiClient', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('should inject Authorization header through interceptor', async () => {
    const client = new ApiClient('http://localhost:8080');

    client.addRequestInterceptor(async (config) => ({
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: 'Bearer jwt-token',
      },
    }));

    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });

    await client.request({ path: '/api/messages', method: 'GET' });

    expect((global as any).fetch).toHaveBeenCalledWith('http://localhost:8080/api/messages', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer jwt-token',
      },
      body: undefined,
    });
  });

  it('should throw an error when backend returns non-2xx response', async () => {
    const client = new ApiClient('http://localhost:8080');

    (global as any).fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    });

    await expect(client.request({ path: '/api/messages', method: 'GET' })).rejects.toThrow('Bad Request');
  });

  it('should call unauthorizedHandler and retry when backend returns 401', async () => {
    const client = new ApiClient('http://localhost:8080');
    const handler = jest.fn().mockResolvedValue(undefined);
    configureUnauthorizedHandler(handler);

    (global as any).fetch
      .mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) });

    const result = await client.request({ path: '/api/test', method: 'GET' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect((global as any).fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });
});
