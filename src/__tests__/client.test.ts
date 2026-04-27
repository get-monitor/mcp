// src/__tests__/client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetMonitorClient, GetMonitorApiError } from '../client/api-client.js';

const BASE = 'https://api.example.com';
const TOKEN = 'test-token';

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  });
}

describe('GetMonitorClient', () => {
  let client: GetMonitorClient;

  beforeEach(() => {
    client = new GetMonitorClient({ baseUrl: BASE, token: TOKEN });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends Bearer token in Authorization header when token provided', async () => {
    const fetchMock = mockFetch({ id: '1', name: 'Test' });
    vi.stubGlobal('fetch', fetchMock);
    await client.get('/v1/monitors');
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/v1/monitors`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
      }),
    );
  });

  it('does not send Authorization header when no token provided', async () => {
    const noTokenClient = new GetMonitorClient({ baseUrl: BASE });
    const fetchMock = mockFetch({ id: '1' });
    vi.stubGlobal('fetch', fetchMock);
    await noTokenClient.get('/v1/status-pages');
    const calledHeaders = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(calledHeaders.Authorization).toBeUndefined();
  });

  it('throws GetMonitorApiError on non-2xx responses', async () => {
    vi.stubGlobal('fetch', mockFetch({ message: 'Not found' }, 404));
    await expect(client.get('/v1/monitors/bad-id')).rejects.toBeInstanceOf(GetMonitorApiError);
  });

  it('sends JSON body on POST', async () => {
    const fetchMock = mockFetch({ id: '123' }, 201);
    vi.stubGlobal('fetch', fetchMock);
    await client.post('/v1/monitors', { name: 'My Monitor' });
    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe('POST');
    expect(JSON.parse(call[1].body as string)).toEqual({ name: 'My Monitor' });
  });

  it('appends query params to GET requests, skipping undefined values', async () => {
    const fetchMock = mockFetch([]);
    vi.stubGlobal('fetch', fetchMock);
    await client.get('/v1/incidents', { status: 'investigating', page: undefined });
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('status=investigating');
    expect(calledUrl).not.toContain('page');
  });
});
