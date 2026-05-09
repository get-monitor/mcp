import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerMonitorTools } from '../../tools/monitors.js';

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

describe('Monitor Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerMonitorTools(server, client);
  });

  describe('list_all_monitors', () => {
    it('calls GET /api/v1/monitors', async () => {
      const responseData = [
        { id: 'monitor-1', name: 'Monitor 1', type: 'uptime' },
        { id: 'monitor-2', name: 'Monitor 2', type: 'ssl' },
      ];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_all_monitors');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/monitors');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_monitor', () => {
    it('calls GET /api/v1/monitors/{id}', async () => {
      const responseData = { id: 'monitor-1', name: 'Monitor 1', type: 'uptime', url: 'https://example.com' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_monitor');
      const result = await handler({ id: 'monitor-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/monitors/monitor-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_organization_monitor_statistics', () => {
    it('calls GET /api/v1/monitors/organization/statistics without timeRange', async () => {
      const responseData = { totalMonitors: 5, activeMonitors: 4, avgUptime: 99.9 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_organization_monitor_statistics');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/monitors/organization/statistics');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/monitors/organization/statistics with timeRange query param', async () => {
      const responseData = { totalMonitors: 5, activeMonitors: 4, avgUptime: 99.9 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_organization_monitor_statistics');
      const result = await handler({ timeRange: '7d' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/monitors/organization/statistics');
      expect(url).toContain('timeRange=7d');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('supports timeRange 24h', async () => {
      const responseData = { totalMonitors: 5, activeMonitors: 5 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_organization_monitor_statistics');
      await handler({ timeRange: '24h' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('timeRange=24h');
    });

    it('supports timeRange 30d', async () => {
      const responseData = { totalMonitors: 5, activeMonitors: 4 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_organization_monitor_statistics');
      await handler({ timeRange: '30d' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('timeRange=30d');
    });
  });

  describe('get_status_page_monitor_statistics', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/monitors/statistics without timeRange', async () => {
      const responseData = { totalMonitors: 3, activeMonitors: 3, avgUptime: 99.95 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_monitor_statistics');
      const result = await handler({ statusPageId: 'status-page-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/status-page-1/monitors/statistics');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/status-pages/{statusPageId}/monitors/statistics with timeRange query param', async () => {
      const responseData = { totalMonitors: 3, activeMonitors: 3 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_monitor_statistics');
      const result = await handler({ statusPageId: 'status-page-1', timeRange: '24h' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/status-page-1/monitors/statistics');
      expect(url).toContain('timeRange=24h');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('supports all timeRange values', async () => {
      for (const timeRange of ['24h', '7d', '30d']) {
        mockFetch.mockResolvedValueOnce(mockResponse({ totalMonitors: 3 }));

        const handler = getToolHandler(server, 'get_status_page_monitor_statistics');
        await handler({ statusPageId: 'status-page-1', timeRange: timeRange as '24h' | '7d' | '30d' });

        const [url] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        expect(url).toContain(`timeRange=${timeRange}`);
      }
    });
  });

  describe('list_status_page_uptime_monitors', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/uptime', async () => {
      const responseData = [
        { id: 'monitor-1', name: 'Website Uptime', status: 'up' },
        { id: 'monitor-2', name: 'API Uptime', status: 'up' },
      ];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_status_page_uptime_monitors');
      const result = await handler({ statusPageId: 'status-page-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/status-page-1/uptime');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('error handling', () => {
    it('returns error text on API error instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({ message: 'Monitor not found' }),
      });

      const handler = getToolHandler(server, 'get_monitor');
      const result = await handler({ id: 'nonexistent' });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error 404: {"message":"Monitor not found"}' }],
      });
    });
  });
});
