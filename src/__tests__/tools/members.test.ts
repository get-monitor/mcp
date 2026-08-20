import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerMemberTools } from '../../tools/members.js';

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

describe('Member Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerMemberTools(server, client);
  });

  describe('list_member_contact_methods', () => {
    it('calls GET /api/v1/members/contact-methods', async () => {
      const responseData = [{ id: 'cm-1', type: 'email' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_member_contact_methods');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/members/contact-methods');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_member_contact_method', () => {
    it('calls POST /api/v1/members/contact-methods', async () => {
      const responseData = { id: 'cm-1', type: 'slack' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_member_contact_method');
      const result = await handler({ type: 'slack', config: { webhookUrl: 'https://hooks.slack.com/x' }, isEnabled: true });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/members/contact-methods');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ type: 'slack', config: { webhookUrl: 'https://hooks.slack.com/x' }, isEnabled: true });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_member_contact_method', () => {
    it('calls PATCH /api/v1/members/contact-methods/{id}', async () => {
      const responseData = { id: 'cm-1', isEnabled: false };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_member_contact_method');
      const result = await handler({ id: 'cm-1', isEnabled: false });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/members/contact-methods/cm-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ isEnabled: false });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('remove_member_contact_method', () => {
    it('calls DELETE /api/v1/members/contact-methods/{id}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'remove_member_contact_method');
      const result = await handler({ id: 'cm-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/members/contact-methods/cm-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('error handling', () => {
    it('returns error text on API error instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({ message: 'Not found' }),
      });
      const handler = getToolHandler(server, 'update_member_contact_method');
      const result = await handler({ id: 'cm_404', isEnabled: false }) as { content: Array<{ type: string; text: string }> };
      expect(result.content[0].text).toContain('Error 404');
    });
  });
});
