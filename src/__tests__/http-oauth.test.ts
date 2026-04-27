import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createHttpApp } from '../http.js';

describe('HTTP transport OAuth', () => {
  const app = createHttpApp({ apiUrl: 'https://api.getmonitor.io', appUrl: 'https://console.getmonitor.io' });

  it('returns RFC 8414 metadata at /.well-known/oauth-authorization-server', async () => {
    const res = await request(app).get('/.well-known/oauth-authorization-server');
    expect(res.status).toBe(200);
    expect(res.body.issuer).toBe('https://mcp.getmonitor.io');
    expect(res.body.authorization_endpoint).toContain('/authorize');
    expect(res.body.token_endpoint).toContain('/token');
    expect(res.body.response_types_supported).toContain('code');
    expect(res.body.code_challenge_methods_supported).toContain('S256');
  });

  it('returns 401 for MCP POST requests without Authorization header', async () => {
    const res = await request(app).post('/mcp').send({ jsonrpc: '2.0', method: 'initialize' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for MCP GET requests without Authorization header', async () => {
    const res = await request(app).get('/mcp');
    expect(res.status).toBe(401);
  });

  it('/token returns 400 for missing code', async () => {
    const res = await request(app).post('/token').send({ grant_type: 'authorization_code' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });
});
