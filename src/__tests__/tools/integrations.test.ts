import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerIntegrationTools } from '../../tools/integrations.js';

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
  const tools = (server as unknown as { _registeredTools: Record<string, { handler: (args: unknown) => unknown }> })._registeredTools;
  if (!tools || !tools[toolName]) {
    throw new Error(`Tool "${toolName}" not found in server`);
  }
  return tools[toolName].handler;
}

describe('Integration Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerIntegrationTools(server, client);
  });

  // ─── Apps Catalog ─────────────────────────────────────────────────────────────

  describe('list_integration_apps', () => {
    it('calls GET /api/v1/integrations/apps without filters', async () => {
      const responseData = [{ id: 'app-1', name: 'Slack' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_integration_apps');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/apps');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/integrations/apps with appType filter', async () => {
      const responseData = [{ id: 'app-2', appType: 'destination' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_integration_apps');
      await handler({ appType: 'destination' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('appType=destination');
    });
  });

  describe('get_integration_app_counts', () => {
    it('calls GET /api/v1/integrations/apps/counts', async () => {
      const responseData = { source: 5, destination: 12 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_integration_app_counts');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/apps/counts');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_integration_app', () => {
    it('calls GET /api/v1/integrations/apps/{appId}', async () => {
      const responseData = { id: 'app-slack', name: 'Slack' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_integration_app');
      const result = await handler({ appId: 'app-slack' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/apps/app-slack');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // ─── Installations ─────────────────────────────────────────────────────────────

  describe('list_installations', () => {
    it('calls GET /api/v1/integrations/installations without filters', async () => {
      const responseData = [{ id: 'inst-1', status: 'active' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_installations');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/integrations/installations with status filter', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([]));

      const handler = getToolHandler(server, 'list_installations');
      await handler({ status: 'active' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('status=active');
    });
  });

  describe('create_installation', () => {
    it('calls POST /api/v1/integrations/installations with config body', async () => {
      const responseData = { id: 'inst-new', status: 'draft' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_installation');
      const result = await handler({ config: { appId: 'app-slack', name: 'My Slack' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toMatchObject({ appId: 'app-slack', name: 'My Slack' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_installation', () => {
    it('calls GET /api/v1/integrations/installations/{id}', async () => {
      const responseData = { id: 'inst-1', status: 'active' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_installation');
      const result = await handler({ id: 'inst-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_installation_config', () => {
    it('calls PATCH /api/v1/integrations/installations/{id} with config body', async () => {
      const responseData = { id: 'inst-1', name: 'Updated Slack' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_installation_config');
      const result = await handler({ id: 'inst-1', config: { name: 'Updated Slack' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toMatchObject({ name: 'Updated Slack' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('disable_installation', () => {
    it('calls POST /api/v1/integrations/installations/{id}/disable with empty body', async () => {
      const responseData = { id: 'inst-1', status: 'disabled' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'disable_installation');
      const result = await handler({ id: 'inst-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1/disable');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_installation_health', () => {
    it('calls GET /api/v1/integrations/installations/{id}/health', async () => {
      const responseData = { healthy: true, lastChecked: '2026-01-01T00:00:00Z' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_installation_health');
      const result = await handler({ id: 'inst-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1/health');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('reconnect_installation', () => {
    it('calls POST /api/v1/integrations/installations/{id}/reconnect with empty body', async () => {
      const responseData = { id: 'inst-1', status: 'active' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'reconnect_installation');
      const result = await handler({ id: 'inst-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1/reconnect');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // ─── Destination Configs ──────────────────────────────────────────────────────

  describe('list_destination_configs', () => {
    it('calls GET /api/v1/integrations/installations/{id}/destination-configs', async () => {
      const responseData = [{ id: 'cfg-1', name: 'Alert Channel' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_destination_configs');
      const result = await handler({ id: 'inst-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1/destination-configs');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_destination_config', () => {
    it('calls POST /api/v1/integrations/installations/{id}/destination-configs with config body', async () => {
      const responseData = { id: 'cfg-new', channel: '#alerts' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_destination_config');
      const result = await handler({ id: 'inst-1', config: { channel: '#alerts' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1/destination-configs');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toMatchObject({ channel: '#alerts' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_destination_config', () => {
    it('calls PATCH /api/v1/integrations/installations/{id}/destination-configs/{configId}', async () => {
      const responseData = { id: 'cfg-1', channel: '#critical-alerts' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_destination_config');
      const result = await handler({ id: 'inst-1', configId: 'cfg-1', config: { channel: '#critical-alerts' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1/destination-configs/cfg-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toMatchObject({ channel: '#critical-alerts' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_destination_config', () => {
    it('calls DELETE /api/v1/integrations/installations/{id}/destination-configs/{configId}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'delete_destination_config');
      const result = await handler({ id: 'inst-1', configId: 'cfg-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1/destination-configs/cfg-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('preview_destination_template', () => {
    it('calls POST /api/v1/integrations/installations/{id}/destination-configs/preview', async () => {
      const responseData = { rendered: 'Alert: Monitor down' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'preview_destination_template');
      const result = await handler({ id: 'inst-1', config: { template: 'Alert: {{name}}', name: 'Monitor down' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1/destination-configs/preview');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('test_destination_config', () => {
    it('calls POST /api/v1/integrations/installations/{id}/destination-configs/{configId}/test', async () => {
      const responseData = { success: true, message: 'Test event sent' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'test_destination_config');
      const result = await handler({ id: 'inst-1', configId: 'cfg-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/integrations/installations/inst-1/destination-configs/cfg-1/test');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('error handling', () => {
    it('returns error text on API error instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({ message: 'Not Found' }),
      });

      const handler = getToolHandler(server, 'get_installation');
      const result = await handler({ id: 'missing-inst' });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error 404: {"message":"Not Found"}' }],
      });
    });
  });
});
