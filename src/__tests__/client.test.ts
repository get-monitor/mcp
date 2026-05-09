import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetMonitorClient, GetMonitorApiError } from '../client/api-client.js';

describe('GetMonitorClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  describe('constructor', () => {
    it('should strip trailing slash from baseUrl', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({ id: '123' }),
      });

      const client = new GetMonitorClient({
        baseUrl: 'https://api.getmonitor.io/',
      });
      await client.get('/api/v1/test');

      expect(mockFetch).toHaveBeenCalledWith('https://api.getmonitor.io/api/v1/test', {
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('GET', () => {
    it('should make a GET request without params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({ id: '123' }),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      const result = await client.get('/users');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual({ id: '123' });
    });

    it('should include string query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({}),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      await client.get('/users', { name: 'john', status: 'active' });

      const call = mockFetch.mock.calls[0];
      const url = call[0];
      expect(url).toContain('name=john');
      expect(url).toContain('status=active');
    });

    it('should convert number query params to string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({}),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      await client.get('/users', { page: 1, limit: 50 });

      const call = mockFetch.mock.calls[0];
      const url = call[0];
      expect(url).toContain('page=1');
      expect(url).toContain('limit=50');
    });

    it('should convert boolean query params to string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({}),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      await client.get('/users', { active: true, archived: false });

      const call = mockFetch.mock.calls[0];
      const url = call[0];
      expect(url).toContain('active=true');
      expect(url).toContain('archived=false');
    });

    it('should skip undefined query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({}),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      await client.get('/users', { name: 'john', status: undefined });

      const call = mockFetch.mock.calls[0];
      const url = call[0];
      expect(url).toContain('name=john');
      expect(url).not.toContain('status');
    });
  });

  describe('POST', () => {
    it('should make a POST request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Map([['content-length', '100']]),
        json: async () => ({ id: '123' }),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      const body = { name: 'John' };
      const result = await client.post('/users', body);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ id: '123' });
    });
  });

  describe('PATCH', () => {
    it('should make a PATCH request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({ id: '123', name: 'Jane' }),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      const body = { name: 'Jane' };
      const result = await client.patch('/users/123', body);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users/123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ id: '123', name: 'Jane' });
    });
  });

  describe('PUT', () => {
    it('should make a PUT request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({ id: '123', name: 'Jane' }),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      const body = { name: 'Jane' };
      const result = await client.put('/users/123', body);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ id: '123', name: 'Jane' });
    });
  });

  describe('DELETE', () => {
    it('should make a DELETE request without body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      await client.delete('/users/123');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users/123', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
      });
    });

    it('should make a DELETE request with optional body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({ deleted: true }),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      const body = { reason: 'user request' };
      const result = await client.delete('/users/123', body);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users/123', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('authentication', () => {
    it('should include Authorization header when token is set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({}),
      });

      const client = new GetMonitorClient({
        baseUrl: 'https://api.example.com',
        token: 'test-token-123',
      });
      await client.get('/users');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123',
        },
      });
    });

    it('should not include Authorization header when token is not set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({}),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      await client.get('/users');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('error handling', () => {
    it('should throw GetMonitorApiError on non-ok response with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({ error: 'Not found' }),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });

      try {
        await client.get('/users/999');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(GetMonitorApiError);
        expect((err as GetMonitorApiError).status).toBe(404);
        expect((err as GetMonitorApiError).body).toEqual({ error: 'Not found' });
        expect((err as GetMonitorApiError).message).toContain('404');
      }
    });

    it('should throw GetMonitorApiError with null body when response is not valid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Map(),
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });

      try {
        await client.get('/users');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(GetMonitorApiError);
        expect((err as GetMonitorApiError).status).toBe(500);
        expect((err as GetMonitorApiError).body).toBeNull();
      }
    });
  });

  describe('response parsing', () => {
    it('should return undefined for 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      const result = await client.delete('/users/123');

      expect(result).toBeUndefined();
    });

    it('should return undefined for response with empty content-length', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      const result = await client.get('/users');

      expect(result).toBeUndefined();
    });

    it('should parse JSON response on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-length', '100']]),
        json: async () => ({ id: '123', name: 'John' }),
      });

      const client = new GetMonitorClient({ baseUrl: 'https://api.example.com' });
      const result = await client.get<{ id: string; name: string }>('/users/123');

      expect(result).toEqual({ id: '123', name: 'John' });
    });
  });
});
