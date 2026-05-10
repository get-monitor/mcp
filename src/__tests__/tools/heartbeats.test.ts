import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerHeartbeatTools } from '../../tools/heartbeats.js';

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

describe('Heartbeat Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerHeartbeatTools(server, client);
  });

  describe('list_heartbeats', () => {
    it('calls GET /api/v1/heartbeats without includeInactive', async () => {
      const responseData = [{ id: 'hb-1' }, { id: 'hb-2' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_heartbeats');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/heartbeats');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/heartbeats with includeInactive=true', async () => {
      const responseData = [{ id: 'hb-1' }, { id: 'hb-2' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_heartbeats');
      const result = await handler({ includeInactive: true });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/heartbeats');
      expect(url).toContain('includeInactive=true');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/heartbeats with includeInactive=false', async () => {
      const responseData = [{ id: 'hb-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_heartbeats');
      await handler({ includeInactive: false });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('includeInactive=false');
    });
  });

  describe('create_heartbeat', () => {
    it('calls POST /api/v1/heartbeats with data', async () => {
      const responseData = { id: 'hb-1', name: 'My Heartbeat' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_heartbeat');
      const result = await handler({ name: 'My Heartbeat', intervalSeconds: 300, gracePeriodSeconds: 60 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/heartbeats');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toMatchObject({ name: 'My Heartbeat', intervalSeconds: 300, gracePeriodSeconds: 60 });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_heartbeat', () => {
    it('calls GET /api/v1/heartbeats/{id}', async () => {
      const responseData = { id: 'hb-abc', name: 'My Heartbeat' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_heartbeat');
      const result = await handler({ id: 'hb-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/heartbeats/hb-abc');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_heartbeat', () => {
    it('calls PATCH /api/v1/heartbeats/{id} with data', async () => {
      const responseData = { id: 'hb-abc', name: 'Updated Heartbeat' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_heartbeat');
      const result = await handler({ id: 'hb-abc', name: 'Updated Heartbeat' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/heartbeats/hb-abc');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ name: 'Updated Heartbeat' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_heartbeat', () => {
    it('calls DELETE /api/v1/heartbeats/{id}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'delete_heartbeat');
      const result = await handler({ id: 'hb-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/heartbeats/hb-abc');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('regenerate_heartbeat_token', () => {
    it('calls POST /api/v1/heartbeats/{id}/token/regenerate with empty body', async () => {
      const responseData = { id: 'hb-abc', token: 'new-token' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'regenerate_heartbeat_token');
      const result = await handler({ id: 'hb-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/heartbeats/hb-abc/token/regenerate');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('pause_heartbeat', () => {
    it('calls POST /api/v1/heartbeats/{id}/pause without hours', async () => {
      const responseData = { id: 'hb-abc', paused: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'pause_heartbeat');
      const result = await handler({ id: 'hb-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/heartbeats/hb-abc/pause');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls POST /api/v1/heartbeats/{id}/pause with hours', async () => {
      const responseData = { id: 'hb-abc', paused: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'pause_heartbeat');
      const result = await handler({ id: 'hb-abc', hours: 24 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ hours: 24 });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('unpause_heartbeat', () => {
    it('calls POST /api/v1/heartbeats/{id}/unpause with empty body', async () => {
      const responseData = { id: 'hb-abc', paused: false };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'unpause_heartbeat');
      const result = await handler({ id: 'hb-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/heartbeats/hb-abc/unpause');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('error handling', () => {
    it('handles API errors for get_heartbeat', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({ message: 'Not found' }),
      });

      const handler = getToolHandler(server, 'get_heartbeat');
      const result = await handler({ id: 'hb_404' }) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('Error 404');
    });
  });
});
