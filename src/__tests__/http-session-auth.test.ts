import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createHttpApp } from '../http.js';

const fetchSpy = vi.spyOn(globalThis, 'fetch');

describe('HTTP auth — session token fallback', () => {
  const app = createHttpApp({ apiUrl: 'http://api.test', appUrl: 'http://app.test' });

  afterEach(() => fetchSpy.mockReset());

  it('returns 401 when token is not in tokenStore and session check fails', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 401 }));
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer unknown-token')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(401);
  });

  it('passes auth when token is not in tokenStore but is a valid session token', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ user: { id: 'u1' }, session: { token: 'sess-tok' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    // Will fail at MCP protocol level, not auth level — that's fine for this test
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer sess-tok')
      .set('Content-Type', 'application/json')
      .send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });
    expect(res.status).not.toBe(401);
  });
});
