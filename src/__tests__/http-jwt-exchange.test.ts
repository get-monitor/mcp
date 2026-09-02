import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createHttpApp } from '../http.js';

const fetchSpy = vi.spyOn(globalThis, 'fetch');

describe('HTTP auth — JWT exchange before calling api', () => {
  const app = createHttpApp({
    apiUrl: 'http://api.test',
    appUrl: 'http://app.test',
    accountsUrl: 'http://accounts.test',
  });

  afterEach(() => fetchSpy.mockReset());

  it('exchanges the session token for a JWT via accounts, then uses the JWT against api', async () => {
    // Path 2 validation call
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ user: { id: 'u1' }, session: { token: 'sess-tok' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    // JWT exchange call
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'the-jwt' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    // tempClient's GET /api/v1/organizations
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer sess-tok')
      .set('Content-Type', 'application/json')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
      });

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      'http://accounts.test/api/auth/token',
      expect.objectContaining({ headers: { Authorization: 'Bearer sess-tok' } }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      'http://api.test/api/v1/organizations',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer the-jwt' }) }),
    );
  });

  it('returns 401 when the JWT exchange fails', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ user: { id: 'u1' }, session: { token: 'sess-tok' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 401 }));

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer sess-tok')
      .set('Content-Type', 'application/json')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } },
      });

    expect(res.status).toBe(401);
  });
});
