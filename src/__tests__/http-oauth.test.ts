import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createHttpApp } from '../http.js';

describe('HTTP transport OAuth', () => {
  const app = createHttpApp({ apiUrl: 'https://api.getmonitor.io', appUrl: 'https://console.getmonitor.io' });

  it('returns RFC 8414 metadata at /.well-known/oauth-authorization-server', async () => {
    const res = await request(app).get('/.well-known/oauth-authorization-server');
    expect(res.status).toBe(200);
    expect(res.body.issuer).toBeDefined();
    expect(res.body.authorization_endpoint).toContain('/authorize');
    expect(res.body.token_endpoint).toContain('/token');
  });

  it('GET /authorize without required params returns 400', async () => {
    const res = await request(app).get('/authorize');
    expect(res.status).toBe(400);
  });

  it('GET /authorize with valid params redirects to appUrl login page', async () => {
    const res = await request(app).get('/authorize').query({
      client_id: 'test-client',
      redirect_uri: 'https://example.com/callback',
      state: 'test-state-123',
      code_challenge: 'test-challenge',
      code_challenge_method: 'S256',
      response_type: 'code',
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('console.getmonitor.io');
    expect(res.headers.location).toContain('login');
    expect(res.headers.location).toContain('state=test-state-123');
  });

  it('POST /token with missing code returns 400 invalid_request', async () => {
    const res = await request(app).post('/token').send({ grant_type: 'authorization_code' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('POST /token with invalid/expired code returns 400 invalid_grant', async () => {
    const res = await request(app)
      .post('/token')
      .send({ grant_type: 'authorization_code', code: 'not-a-real-code' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_grant');
  });

  it('GET /mcp without auth header returns 401', async () => {
    const res = await request(app).get('/mcp');
    expect(res.status).toBe(401);
  });

  it('POST /mcp with invalid Bearer token returns 401', async () => {
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer not-a-valid-token')
      .send({ jsonrpc: '2.0', method: 'initialize' });
    expect(res.status).toBe(401);
  });
});
