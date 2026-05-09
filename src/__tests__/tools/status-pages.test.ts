import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerStatusPageTools } from '../../tools/status-pages.js';

// Helper to create a mock fetch response
function mockResponse(data: unknown, status = 200) {
  return {
    ok: true,
    status,
    headers: new Map([['content-length', '100']]),
    json: async () => data,
  };
}

function mockEmpty() {
  return {
    ok: true,
    status: 204,
    headers: new Map([['content-length', '0']]),
    json: async () => null,
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

describe('Status Page Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerStatusPageTools(server, client);
  });

  // -------------------------------------------------------------------------
  // Public endpoints
  // -------------------------------------------------------------------------

  describe('resolve_status_page', () => {
    it('calls GET /api/v1/status-pages with slug query param', async () => {
      const responseData = { id: 'sp-1', slug: 'my-page' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'resolve_status_page');
      const result = await handler({ slug: 'my-page' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages');
      expect(url).toContain('slug=my-page');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_status_page_status', () => {
    it('calls GET /api/v1/status-pages/{id}/status', async () => {
      const responseData = { status: 'operational' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_status');
      const result = await handler({ id: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/status');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('check_status_page_domain_availability', () => {
    it('calls GET /api/v1/status-pages/domain/availability with slug', async () => {
      const responseData = { available: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'check_status_page_domain_availability');
      const result = await handler({ slug: 'my-page' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/domain/availability');
      expect(url).toContain('slug=my-page');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_status_page_customization', () => {
    it('calls GET /api/v1/status-pages/{id}/customization', async () => {
      const responseData = { theme: 'dark', accentColor: '#ff0000' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_customization');
      const result = await handler({ id: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/customization');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_status_page_monitors', () => {
    it('calls GET /api/v1/status-pages/{id}/monitors', async () => {
      const responseData = [{ id: 'mon-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_monitors');
      const result = await handler({ id: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/monitors');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_status_page_component_tree', () => {
    it('calls GET /api/v1/status-pages/{id}/components', async () => {
      const responseData = { components: [] };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_component_tree');
      const result = await handler({ id: 'sp-1', days: 30 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/sp-1/components');
      expect(url).toContain('days=30');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_monitor_aggregations', () => {
    it('calls GET /api/v1/status-pages/{id}/monitors/{monitorId}/aggregations', async () => {
      const responseData = { uptime: 99.9 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_monitor_aggregations');
      const result = await handler({ id: 'sp-1', monitorId: 'mon-1', date: '2024-01-15' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/sp-1/monitors/mon-1/aggregations');
      expect(url).toContain('date=2024-01-15');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_status_page_incidents', () => {
    it('calls GET /api/v1/status-pages/{id}/incidents', async () => {
      const responseData = [{ id: 'inc-1', title: 'API slowdown' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_status_page_incidents');
      const result = await handler({ id: 'sp-1', limit: 10, page: 1 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/sp-1/incidents');
      expect(url).toContain('limit=10');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_status_page_incident', () => {
    it('calls GET /api/v1/status-pages/{id}/incidents/{incidentId}', async () => {
      const responseData = { id: 'inc-1', title: 'API slowdown' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_incident');
      const result = await handler({ id: 'sp-1', incidentId: 'inc-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/incidents/inc-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_status_page_maintenance', () => {
    it('calls GET /api/v1/status-pages/{id}/maintenance', async () => {
      const responseData = [{ id: 'maint-1', title: 'Scheduled downtime' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_status_page_maintenance');
      const result = await handler({ id: 'sp-1', limit: 5 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/sp-1/maintenance');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_status_page_maintenance_item', () => {
    it('calls GET /api/v1/status-pages/{id}/maintenance/{maintenanceId}', async () => {
      const responseData = { id: 'maint-1', title: 'Scheduled downtime' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_maintenance_item');
      const result = await handler({ id: 'sp-1', maintenanceId: 'maint-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/maintenance/maint-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_status_page_updates', () => {
    it('calls GET /api/v1/status-pages/{id}/updates', async () => {
      const responseData = [{ id: 'upd-1', message: 'We are investigating' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_status_page_updates');
      const result = await handler({ id: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/sp-1/updates');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_status_page_badge', () => {
    it('calls GET /api/v1/status-pages/{id}/badge', async () => {
      const responseData = '<svg>...</svg>';
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_badge');
      const result = await handler({ id: 'sp-1', preview: 'operational' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/sp-1/badge');
      expect(url).toContain('preview=operational');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // -------------------------------------------------------------------------
  // Management — Status Pages CRUD
  // -------------------------------------------------------------------------

  describe('list_managed_status_pages', () => {
    it('calls GET /api/v1/manage/status-pages', async () => {
      const responseData = [{ id: 'sp-1', name: 'My Status Page' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_managed_status_pages');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/manage/status-pages');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_status_page', () => {
    it('calls POST /api/v1/manage/status-pages with data', async () => {
      const responseData = { id: 'sp-new', name: 'New Page' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_status_page');
      const result = await handler({ data: { name: 'New Page', slug: 'new-page' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/manage/status-pages');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toMatchObject({ name: 'New Page', slug: 'new-page' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_managed_status_page', () => {
    it('calls GET /api/v1/manage/status-pages/{id}', async () => {
      const responseData = { id: 'sp-1', name: 'My Page' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_managed_status_page');
      const result = await handler({ id: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/manage/status-pages/sp-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_status_page', () => {
    it('calls DELETE /api/v1/manage/status-pages/{id}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_status_page');
      const result = await handler({ id: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/manage/status-pages/sp-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('update_status_page', () => {
    it('calls PATCH /api/v1/status-pages/{id} with data', async () => {
      const responseData = { id: 'sp-1', name: 'Updated Page' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_status_page');
      const result = await handler({ id: 'sp-1', data: { name: 'Updated Page' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toMatchObject({ name: 'Updated Page' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // -------------------------------------------------------------------------
  // Management — Customization + Domain
  // -------------------------------------------------------------------------

  describe('update_status_page_customization', () => {
    it('calls PATCH /api/v1/status-pages/{id}/customization', async () => {
      const responseData = { theme: 'light' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_status_page_customization');
      const result = await handler({ id: 'sp-1', data: { theme: 'light' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/customization');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('reset_status_page_customization', () => {
    it('calls DELETE /api/v1/status-pages/{id}/customization', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'reset_status_page_customization');
      const result = await handler({ id: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/customization');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('get_status_page_badge_config', () => {
    it('calls GET /api/v1/status-pages/{id}/badge/config', async () => {
      const responseData = { textOperational: 'All systems go' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_badge_config');
      const result = await handler({ id: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/sp-1/badge/config');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('set_status_page_domain', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/domain', async () => {
      const responseData = { domain: 'status.myapp.com' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'set_status_page_domain');
      const result = await handler({ statusPageId: 'sp-1', data: { domain: 'status.myapp.com' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/domain');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('remove_status_page_domain', () => {
    it('calls DELETE /api/v1/status-pages/{statusPageId}/domain', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'remove_status_page_domain');
      const result = await handler({ statusPageId: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/domain');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('verify_status_page_domain', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/domain/verify', async () => {
      const responseData = { verified: false };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'verify_status_page_domain');
      const result = await handler({ statusPageId: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/domain/verify');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('check_status_page_domain_verification', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/domain/verification', async () => {
      const responseData = { verified: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'check_status_page_domain_verification');
      const result = await handler({ statusPageId: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/domain/verification');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // -------------------------------------------------------------------------
  // Management — Component Groups
  // -------------------------------------------------------------------------

  describe('list_component_groups', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/component-groups', async () => {
      const responseData = [{ id: 'grp-1', name: 'Infrastructure' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_component_groups');
      const result = await handler({ statusPageId: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/component-groups');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_component_group', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/component-groups', async () => {
      const responseData = { id: 'grp-new', name: 'API' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_component_group');
      const result = await handler({ statusPageId: 'sp-1', data: { name: 'API' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/component-groups');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('reorder_component_groups', () => {
    it('calls PATCH /api/v1/status-pages/{statusPageId}/component-groups/reorder', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'reorder_component_groups');
      const result = await handler({ statusPageId: 'sp-1', data: { order: ['grp-2', 'grp-1'] } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/component-groups/reorder');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_component_group', () => {
    it('calls PATCH /api/v1/status-pages/{statusPageId}/component-groups/{groupId}', async () => {
      const responseData = { id: 'grp-1', name: 'Updated Group' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_component_group');
      const result = await handler({ statusPageId: 'sp-1', groupId: 'grp-1', data: { name: 'Updated Group' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/component-groups/grp-1');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_component_group', () => {
    it('calls DELETE /api/v1/status-pages/{statusPageId}/component-groups/{groupId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_component_group');
      const result = await handler({ statusPageId: 'sp-1', groupId: 'grp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/component-groups/grp-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('move_component_group', () => {
    it('calls PATCH /api/v1/status-pages/{statusPageId}/component-groups/{groupId}/move', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'move_component_group');
      const result = await handler({ statusPageId: 'sp-1', groupId: 'grp-1', data: { position: 0 } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/component-groups/grp-1/move');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // -------------------------------------------------------------------------
  // Management — Monitors on Status Page
  // -------------------------------------------------------------------------

  describe('link_monitor_to_status_page', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/monitors', async () => {
      const responseData = { id: 'mon-link-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'link_monitor_to_status_page');
      const result = await handler({ statusPageId: 'sp-1', data: { monitorId: 'mon-1' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/monitors');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('unlink_monitor_from_status_page', () => {
    it('calls DELETE /api/v1/status-pages/{statusPageId}/monitors/{monitorId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'unlink_monitor_from_status_page');
      const result = await handler({ statusPageId: 'sp-1', monitorId: 'mon-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/monitors/mon-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('get_grouped_status_page_monitors', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/monitors/grouped', async () => {
      const responseData = [{ groupId: 'grp-1', monitors: [] }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_grouped_status_page_monitors');
      const result = await handler({ statusPageId: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/monitors/grouped');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('reorder_status_page_monitors', () => {
    it('calls PATCH /api/v1/status-pages/{statusPageId}/monitors/reorder', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'reorder_status_page_monitors');
      const result = await handler({ statusPageId: 'sp-1', data: { order: ['mon-2', 'mon-1'] } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/monitors/reorder');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('move_monitor_to_group', () => {
    it('calls PATCH /api/v1/status-pages/{statusPageId}/monitors/{monitorId}/group', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'move_monitor_to_group');
      const result = await handler({ statusPageId: 'sp-1', monitorId: 'mon-1', data: { groupId: 'grp-2' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/monitors/mon-1/group');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // -------------------------------------------------------------------------
  // Management — Static Components
  // -------------------------------------------------------------------------

  describe('list_static_components', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/static-components', async () => {
      const responseData = [{ id: 'comp-1', name: 'API Gateway' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_static_components');
      const result = await handler({ statusPageId: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/static-components');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_static_component', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/static-components', async () => {
      const responseData = { id: 'comp-new', name: 'Database' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_static_component');
      const result = await handler({ statusPageId: 'sp-1', data: { name: 'Database' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/static-components');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('reorder_static_components', () => {
    it('calls PATCH /api/v1/status-pages/{statusPageId}/static-components/reorder', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'reorder_static_components');
      const result = await handler({ statusPageId: 'sp-1', data: { order: ['comp-2', 'comp-1'] } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/static-components/reorder');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_static_component', () => {
    it('calls PATCH /api/v1/status-pages/{statusPageId}/static-components/{componentId}', async () => {
      const responseData = { id: 'comp-1', name: 'Updated Component' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_static_component');
      const result = await handler({ statusPageId: 'sp-1', componentId: 'comp-1', data: { name: 'Updated Component' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/static-components/comp-1');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_static_component', () => {
    it('calls DELETE /api/v1/status-pages/{statusPageId}/static-components/{componentId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_static_component');
      const result = await handler({ statusPageId: 'sp-1', componentId: 'comp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/static-components/comp-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('upsert_static_component_override', () => {
    it('calls PUT /api/v1/status-pages/{statusPageId}/static-components/{componentId}/overrides/{date}', async () => {
      const responseData = { date: '2024-01-15', status: 'degraded' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'upsert_static_component_override');
      const result = await handler({
        statusPageId: 'sp-1',
        componentId: 'comp-1',
        date: '2024-01-15',
        data: { status: 'degraded' },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/static-components/comp-1/overrides/2024-01-15');
      expect(options.method).toBe('PUT');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_static_component_override', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/static-components/{componentId}/overrides/{date}', async () => {
      const responseData = { date: '2024-01-15', status: 'degraded' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_static_component_override');
      const result = await handler({
        statusPageId: 'sp-1',
        componentId: 'comp-1',
        date: '2024-01-15',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/static-components/comp-1/overrides/2024-01-15');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // -------------------------------------------------------------------------
  // Management — Incidents
  // -------------------------------------------------------------------------

  describe('create_incident', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/incidents', async () => {
      const responseData = { id: 'inc-new', title: 'Database outage' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_incident');
      const result = await handler({ statusPageId: 'sp-1', data: { title: 'Database outage' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/incidents');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_incident', () => {
    it('calls PATCH /api/v1/status-pages/{statusPageId}/incidents/{incidentId}', async () => {
      const responseData = { id: 'inc-1', status: 'resolved' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_incident');
      const result = await handler({ statusPageId: 'sp-1', incidentId: 'inc-1', data: { status: 'resolved' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/incidents/inc-1');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_incident', () => {
    it('calls DELETE /api/v1/status-pages/{statusPageId}/incidents/{incidentId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_incident');
      const result = await handler({ statusPageId: 'sp-1', incidentId: 'inc-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/incidents/inc-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('resolve_incident', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/incidents/{incidentId}/resolve', async () => {
      const responseData = { id: 'inc-1', status: 'resolved' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'resolve_incident');
      const result = await handler({ statusPageId: 'sp-1', incidentId: 'inc-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/incidents/inc-1/resolve');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('add_incident_update', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/incidents/{incidentId}/updates', async () => {
      const responseData = { id: 'upd-1', message: 'We are still investigating' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'add_incident_update');
      const result = await handler({
        statusPageId: 'sp-1',
        incidentId: 'inc-1',
        data: { message: 'We are still investigating' },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/incidents/inc-1/updates');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_status_page_health_score', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/incidents/health-score', async () => {
      const responseData = { score: 98.5 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_health_score');
      const result = await handler({ statusPageId: 'sp-1', timeRange: '30d' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/sp-1/incidents/health-score');
      expect(url).toContain('timeRange=30d');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // -------------------------------------------------------------------------
  // Management — Maintenance
  // -------------------------------------------------------------------------

  describe('create_maintenance', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/maintenance', async () => {
      const responseData = { id: 'maint-new', title: 'Planned upgrade' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_maintenance');
      const result = await handler({ statusPageId: 'sp-1', data: { title: 'Planned upgrade' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/maintenance');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_maintenance', () => {
    it('calls PATCH /api/v1/status-pages/{statusPageId}/maintenance/{maintenanceId}', async () => {
      const responseData = { id: 'maint-1', title: 'Updated maintenance' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_maintenance');
      const result = await handler({ statusPageId: 'sp-1', maintenanceId: 'maint-1', data: { title: 'Updated maintenance' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/maintenance/maint-1');
      expect(options.method).toBe('PATCH');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_maintenance', () => {
    it('calls DELETE /api/v1/status-pages/{statusPageId}/maintenance/{maintenanceId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_maintenance');
      const result = await handler({ statusPageId: 'sp-1', maintenanceId: 'maint-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/maintenance/maint-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('add_maintenance_update', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/maintenance/{maintenanceId}/updates', async () => {
      const responseData = { id: 'upd-1', message: 'Maintenance is ongoing' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'add_maintenance_update');
      const result = await handler({
        statusPageId: 'sp-1',
        maintenanceId: 'maint-1',
        data: { message: 'Maintenance is ongoing' },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/maintenance/maint-1/updates');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('start_maintenance', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/maintenance/{maintenanceId}/start', async () => {
      const responseData = { id: 'maint-1', status: 'in_progress' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'start_maintenance');
      const result = await handler({ statusPageId: 'sp-1', maintenanceId: 'maint-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/maintenance/maint-1/start');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('complete_maintenance', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/maintenance/{maintenanceId}/complete', async () => {
      const responseData = { id: 'maint-1', status: 'completed' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'complete_maintenance');
      const result = await handler({ statusPageId: 'sp-1', maintenanceId: 'maint-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/maintenance/maint-1/complete');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('cancel_maintenance', () => {
    it('calls POST /api/v1/status-pages/{statusPageId}/maintenance/{maintenanceId}/cancel', async () => {
      const responseData = { id: 'maint-1', status: 'cancelled' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'cancel_maintenance');
      const result = await handler({ statusPageId: 'sp-1', maintenanceId: 'maint-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/maintenance/maint-1/cancel');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // -------------------------------------------------------------------------
  // Management — Subscribers
  // -------------------------------------------------------------------------

  describe('list_status_page_subscribers', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/subscriptions', async () => {
      const responseData = [{ id: 'sub-1', email: 'user@example.com' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_status_page_subscribers');
      const result = await handler({ statusPageId: 'sp-1', limit: 20 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/status-pages/sp-1/subscriptions');
      expect(url).toContain('limit=20');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('remove_status_page_subscriber', () => {
    it('calls DELETE /api/v1/status-pages/{statusPageId}/subscriptions/{subscriptionId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'remove_status_page_subscriber');
      const result = await handler({ statusPageId: 'sp-1', subscriptionId: 'sub-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/subscriptions/sub-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('export_status_page_subscribers', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/subscriptions/export', async () => {
      const responseData = 'email\nuser@example.com\n';
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'export_status_page_subscribers');
      const result = await handler({ statusPageId: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/subscriptions/export');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_status_page_subscription_analytics', () => {
    it('calls GET /api/v1/status-pages/{statusPageId}/subscriptions/analytics', async () => {
      const responseData = { total: 150, newThisMonth: 12 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_status_page_subscription_analytics');
      const result = await handler({ statusPageId: 'sp-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/sp-1/subscriptions/analytics');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('returns error text on API error instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({ message: 'Not found' }),
      });

      const handler = getToolHandler(server, 'get_status_page_status');
      const result = await handler({ id: 'nonexistent' });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error 404: {"message":"Not found"}' }],
      });
    });
  });
});
