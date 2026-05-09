import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerUserTools } from '../../tools/users.js';

// Helper to create a mock fetch response
function mockResponse(data: unknown, status = 200) {
  return {
    ok: true,
    status,
    headers: new Map([['content-length', '100']]),
    json: async () => data,
  };
}

// Helper to find a registered tool handler by name
function getToolHandler(server: McpServer, toolName: string) {
  // Access internal tool registry via the registered tools
  const tools = (server as unknown as { _registeredTools: Record<string, { handler: (args: unknown) => unknown }> })._registeredTools;
  if (!tools || !tools[toolName]) {
    throw new Error(`Tool "${toolName}" not found in server`);
  }
  return tools[toolName].handler;
}

describe('User Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerUserTools(server, client);
  });

  describe('check_email', () => {
    it('calls POST /api/v1/users/check-email with email in body', async () => {
      const responseData = { available: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'check_email');
      const result = await handler({ email: 'test@example.com' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/check-email');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ email: 'test@example.com' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_user_with_organization', () => {
    it('calls POST /api/v1/users/create-with-organization with required fields', async () => {
      const responseData = { id: 'user-1', email: 'test@example.com', fullName: 'Test User' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_user_with_organization');
      const result = await handler({ fullName: 'Test User', email: 'test@example.com', companyName: 'Test Co' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/create-with-organization');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toMatchObject({ fullName: 'Test User', email: 'test@example.com', companyName: 'Test Co' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls POST with optional language parameter', async () => {
      const responseData = { id: 'user-1', email: 'test@example.com' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_user_with_organization');
      await handler({ fullName: 'Test User', email: 'test@example.com', companyName: 'Test Co', language: 'pt-BR' });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({ fullName: 'Test User', email: 'test@example.com', companyName: 'Test Co', language: 'pt-BR' });
    });
  });

  describe('get_current_user', () => {
    it('calls GET /api/v1/users/me', async () => {
      const responseData = { id: 'user-1', email: 'test@example.com', fullName: 'Test User' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_current_user');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/me');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_current_user', () => {
    it('calls PATCH /api/v1/users/me with provided fields', async () => {
      const responseData = { id: 'user-1', name: 'Updated Name' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_current_user');
      const result = await handler({ name: 'Updated Name' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/me');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toMatchObject({ name: 'Updated Name' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls PATCH with both name and image', async () => {
      const responseData = { id: 'user-1', name: 'Updated Name', image: 'https://example.com/image.png' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_current_user');
      await handler({ name: 'Updated Name', image: 'https://example.com/image.png' });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({ name: 'Updated Name', image: 'https://example.com/image.png' });
    });
  });

  describe('delete_current_user', () => {
    it('calls DELETE /api/v1/users/me', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'delete_current_user');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/me');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('update_user_language', () => {
    it('calls PATCH /api/v1/users/me/language with language', async () => {
      const responseData = { id: 'user-1', language: 'pt-BR' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_user_language');
      const result = await handler({ language: 'pt-BR' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/me/language');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ language: 'pt-BR' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('accept_migration', () => {
    it('calls POST /api/v1/users/me/accept-migration with empty body', async () => {
      const responseData = { status: 'migrated' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'accept_migration');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/me/accept-migration');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_user_sessions', () => {
    it('calls GET /api/v1/users/me/sessions', async () => {
      const responseData = [{ id: 'session-1', createdAt: '2025-01-01' }, { id: 'session-2', createdAt: '2025-01-02' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_user_sessions');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/me/sessions');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('revoke_all_other_sessions', () => {
    it('calls DELETE /api/v1/users/me/sessions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'revoke_all_other_sessions');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/me/sessions');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('revoke_session', () => {
    it('calls DELETE /api/v1/users/me/sessions/{sessionId}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'revoke_session');
      const result = await handler({ sessionId: 'session-123' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/me/sessions/session-123');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('list_linked_accounts', () => {
    it('calls GET /api/v1/users/me/accounts', async () => {
      const responseData = [{ provider: 'google', email: 'test@gmail.com' }, { provider: 'github', username: 'testuser' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_linked_accounts');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/me/accounts');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('unlink_oauth_account', () => {
    it('calls DELETE /api/v1/users/me/account with no body when no parameters provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'unlink_oauth_account');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/me/account');
      expect(options.method).toBe('DELETE');
      expect(options.body).toBeUndefined();
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });

    it('calls DELETE /api/v1/users/me/account with password in body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'unlink_oauth_account');
      await handler({ password: 'mypassword' });

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toMatchObject({ password: 'mypassword' });
    });

    it('calls DELETE /api/v1/users/me/account with callbackURL in body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'unlink_oauth_account');
      await handler({ callbackURL: 'https://example.com/callback' });

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toMatchObject({ callbackURL: 'https://example.com/callback' });
    });

    it('calls DELETE /api/v1/users/me/account with both password and callbackURL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'unlink_oauth_account');
      await handler({ password: 'mypassword', callbackURL: 'https://example.com/callback' });

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toMatchObject({ password: 'mypassword', callbackURL: 'https://example.com/callback' });
    });
  });

  describe('get_user', () => {
    it('calls GET /api/v1/users/{userId}', async () => {
      const responseData = { id: 'user-123', email: 'test@example.com', fullName: 'Test User' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_user');
      const result = await handler({ userId: 'user-123' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/users/user-123');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('error handling', () => {
    it('returns error text on API error instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({ message: 'User not found' }),
      });

      const handler = getToolHandler(server, 'get_user');
      const result = await handler({ userId: 'user-invalid' });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error 404: {"message":"User not found"}' }],
      });
    });
  });
});
