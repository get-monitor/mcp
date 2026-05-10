import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerUptimeTools } from '../../tools/uptime.js';

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

describe('Uptime Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerUptimeTools(server, client);
  });

  describe('list_uptime_monitors', () => {
    it('calls GET /api/v1/uptime without query params', async () => {
      const responseData = [{ id: 'monitor-1', name: 'API Monitor' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_uptime_monitors');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/uptime');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/uptime with include query param', async () => {
      const responseData = [{ id: 'monitor-1', name: 'API Monitor', metrics: { uptime: 99.5 } }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_uptime_monitors');
      const result = await handler({ include: 'metrics' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/uptime');
      expect(url).toContain('include=metrics');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_uptime_monitor', () => {
    it('calls POST /api/v1/uptime with monitor data', async () => {
      const responseData = { id: 'monitor-1', name: 'API Monitor', targetUrl: 'https://api.example.com' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_uptime_monitor');
      const result = await handler({
        name: 'API Monitor',
        targetUrl: 'https://api.example.com',
        checkType: 'UPTIME',
        followRedirects: true,
        regions: ['us-east-1'],
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/uptime');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toMatchObject({ name: 'API Monitor', targetUrl: 'https://api.example.com' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls POST /api/v1/uptime with complex monitor configuration', async () => {
      const responseData = { id: 'monitor-1', name: 'API Monitor' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_uptime_monitor');
      await handler({
        name: 'API Monitor',
        targetUrl: 'https://api.example.com',
        checkType: 'UPTIME',
        followRedirects: false,
        regions: ['us-east-1', 'eu-west-1'],
        timeout: '30s',
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({ name: 'API Monitor', regions: ['us-east-1', 'eu-west-1'] });
    });
  });

  describe('get_uptime_monitor', () => {
    it('calls GET /api/v1/uptime/{id}', async () => {
      const responseData = { id: 'monitor-1', name: 'API Monitor', url: 'https://api.example.com' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_uptime_monitor');
      const result = await handler({ id: 'monitor-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/uptime/monitor-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_uptime_monitor', () => {
    it('calls PATCH /api/v1/uptime/{id} with update data', async () => {
      const responseData = { id: 'monitor-1', name: 'Updated Monitor', targetUrl: 'https://api.example.com' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_uptime_monitor');
      const result = await handler({ id: 'monitor-1', name: 'Updated Monitor' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/uptime/monitor-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toMatchObject({ name: 'Updated Monitor' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls PATCH /api/v1/uptime/{id} with complex update data', async () => {
      const responseData = { id: 'monitor-1', name: 'Updated Monitor', regions: ['us-west-2'] };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_uptime_monitor');
      await handler({ id: 'monitor-1', name: 'Updated Monitor', regions: ['us-west-2'] });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({ name: 'Updated Monitor', regions: ['us-west-2'] });
    });
  });

  describe('delete_uptime_monitor', () => {
    it('calls DELETE /api/v1/uptime/{id}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'delete_uptime_monitor');
      const result = await handler({ id: 'monitor-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/uptime/monitor-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('get_uptime_monitor_statistics', () => {
    it('calls GET /api/v1/uptime/{id}/statistics without time range', async () => {
      const responseData = { uptime: 99.5, downtime: 0.5, checks: 1000 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_uptime_monitor_statistics');
      const result = await handler({ id: 'monitor-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/uptime/monitor-1/statistics');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/uptime/{id}/statistics with 24h time range', async () => {
      const responseData = { uptime: 99.8, downtime: 0.2, checks: 500 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_uptime_monitor_statistics');
      const result = await handler({ id: 'monitor-1', timeRange: '24h' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/uptime/monitor-1/statistics');
      expect(url).toContain('timeRange=24h');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/uptime/{id}/statistics with 7d time range', async () => {
      const responseData = { uptime: 99.2, downtime: 0.8, checks: 3500 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_uptime_monitor_statistics');
      const result = await handler({ id: 'monitor-1', timeRange: '7d' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('timeRange=7d');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_uptime_logs', () => {
    it('calls GET /api/v1/uptime/{id}/uptime-logs without query params', async () => {
      const responseData = [
        { timestamp: '2024-01-01T00:00:00Z', status: 'UP', region: 'us-east-1' },
        { timestamp: '2024-01-01T00:05:00Z', status: 'UP', region: 'us-east-1' },
      ];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_uptime_logs');
      const result = await handler({ id: 'monitor-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/uptime/monitor-1/uptime-logs');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/uptime/{id}/uptime-logs with date range', async () => {
      const responseData = [{ timestamp: '2024-01-01T00:00:00Z', status: 'UP', region: 'us-east-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_uptime_logs');
      const result = await handler({
        id: 'monitor-1',
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-02T00:00:00Z',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/uptime/monitor-1/uptime-logs');
      expect(url).toContain('dateFrom=2024-01-01T00%3A00%3A00Z');
      expect(url).toContain('dateTo=2024-01-02T00%3A00%3A00Z');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/uptime/{id}/uptime-logs with region filter', async () => {
      const responseData = [{ timestamp: '2024-01-01T00:00:00Z', status: 'UP', region: 'us-east-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_uptime_logs');
      const result = await handler({
        id: 'monitor-1',
        region: 'us-east-1,eu-west-1',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('region=us-east-1%2Ceu-west-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/uptime/{id}/uptime-logs with status filter', async () => {
      const responseData = [{ timestamp: '2024-01-01T00:00:00Z', status: 'DOWN', region: 'us-east-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_uptime_logs');
      const result = await handler({
        id: 'monitor-1',
        status: 'UP,DOWN',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('status=UP%2CDOWN');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/uptime/{id}/uptime-logs with limit and cursor', async () => {
      const responseData = [{ timestamp: '2024-01-01T00:00:00Z', status: 'UP', region: 'us-east-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_uptime_logs');
      const result = await handler({
        id: 'monitor-1',
        limit: 50,
        cursor: 'next-page-token',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('limit=50');
      expect(url).toContain('cursor=next-page-token');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/uptime/{id}/uptime-logs with all query parameters', async () => {
      const responseData = [{ timestamp: '2024-01-01T00:00:00Z', status: 'UP', region: 'us-east-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_uptime_logs');
      await handler({
        id: 'monitor-1',
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-02T00:00:00Z',
        region: 'us-east-1',
        status: 'UP,DOWN',
        limit: 100,
        cursor: 'token',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('dateFrom=');
      expect(url).toContain('dateTo=');
      expect(url).toContain('region=us-east-1');
      expect(url).toContain('status=UP%2CDOWN');
      expect(url).toContain('limit=100');
      expect(url).toContain('cursor=token');
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

      const handler = getToolHandler(server, 'get_uptime_monitor');
      const result = await handler({ id: 'nonexistent' });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error 404: {"message":"Monitor not found"}' }],
      });
    });

    it('handles 500 error on create', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Map(),
        json: async () => ({ message: 'Internal server error' }),
      });

      const handler = getToolHandler(server, 'create_uptime_monitor');
      const result = await handler({
        name: 'Test',
        targetUrl: 'https://test.example.com',
        checkType: 'UPTIME',
        followRedirects: true,
        regions: ['us-east-1'],
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error 500: {"message":"Internal server error"}' }],
      });
    });
  });
});
