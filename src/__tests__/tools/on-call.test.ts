import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerOnCallTools } from '../../tools/on-call.js';

// Helper to create a mock fetch response
function mockResponse(data: unknown, status = 200) {
  return {
    ok: true,
    status,
    headers: new Map([['content-length', '100']]),
    json: async () => data,
  };
}

function mockEmpty(status = 204) {
  return {
    ok: true,
    status,
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

describe('On-Call Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerOnCallTools(server, client);
  });

  // ─── Alerts ───────────────────────────────────────────────────────────────

  describe('get_oncall_alerts_stats', () => {
    it('calls GET /api/v1/on-call/alerts/stats with the default window', async () => {
      const responseData = { totalSent: 5, bySource: { monitor: 3, integration_installation: 2 } };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_oncall_alerts_stats');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/alerts/stats?window=24h');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('passes an explicit window through', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ totalSent: 0, bySource: { monitor: 0, integration_installation: 0 } }));

      const handler = getToolHandler(server, 'get_oncall_alerts_stats');
      await handler({ window: '24h' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('window=24h');
    });
  });

  describe('list_oncall_alerts', () => {
    it('calls GET /api/v1/on-call/alerts without filters', async () => {
      const responseData = [{ id: 'alert-1', lifecycleStatus: 'firing' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_oncall_alerts');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/alerts');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/on-call/alerts with lifecycleStatus filter', async () => {
      const responseData = [{ id: 'alert-1', lifecycleStatus: 'acknowledged' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_oncall_alerts');
      const result = await handler({ lifecycleStatus: 'acknowledged' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/alerts?lifecycleStatus=acknowledged');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('acknowledge_oncall_alert', () => {
    it('calls PATCH /api/v1/on-call/alerts/{id}/acknowledge with empty body', async () => {
      const responseData = { id: 'alert-1', lifecycleStatus: 'acknowledged' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'acknowledge_oncall_alert');
      const result = await handler({ id: 'alert-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/alerts/alert-1/acknowledge');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('resolve_oncall_alert', () => {
    it('calls PATCH /api/v1/on-call/alerts/{id}/resolve with empty body', async () => {
      const responseData = { id: 'alert-1', lifecycleStatus: 'resolved' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'resolve_oncall_alert');
      const result = await handler({ id: 'alert-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/alerts/alert-1/resolve');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // ─── Routes ───────────────────────────────────────────────────────────────

  describe('list_oncall_routes', () => {
    it('calls GET /api/v1/on-call/routes with sourceType and sourceId', async () => {
      const responseData = [{ id: 'route-1', sourceType: 'monitor', sourceId: 'monitor-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_oncall_routes');
      const result = await handler({ sourceType: 'monitor', sourceId: 'monitor-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/routes?sourceType=monitor&sourceId=monitor-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_oncall_route', () => {
    it('calls POST /api/v1/on-call/routes with body', async () => {
      const responseData = { id: 'route-1', sourceType: 'monitor', sourceId: 'monitor-1', scheduleId: 'sched-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_oncall_route');
      const result = await handler({ sourceType: 'monitor', sourceId: 'monitor-1', scheduleId: 'sched-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/routes');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ sourceType: 'monitor', sourceId: 'monitor-1', scheduleId: 'sched-1' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_oncall_route', () => {
    it('calls DELETE /api/v1/on-call/routes/{id}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_oncall_route');
      const result = await handler({ id: 'route-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/routes/route-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  // ─── Rotations ────────────────────────────────────────────────────────────

  describe('update_rotation_member', () => {
    it('calls PATCH /api/v1/on-call/rotation-members/{id} with optional position', async () => {
      const responseData = { id: 'rotmem-1', position: 2 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_rotation_member');
      const result = await handler({ id: 'rotmem-1', position: 2 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/rotation-members/rotmem-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ position: 2 });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('remove_rotation_member', () => {
    it('calls DELETE /api/v1/on-call/rotation-members/{id}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'remove_rotation_member');
      const result = await handler({ id: 'rotmem-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/rotation-members/rotmem-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('add_rotation_member', () => {
    it('calls POST /api/v1/on-call/rotations/{id}/members with required and optional fields', async () => {
      const responseData = { id: 'rotmem-1', userId: 'user-1', position: 1 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'add_rotation_member');
      const result = await handler({ id: 'rot-1', userId: 'user-1', position: 1 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/rotations/rot-1/members');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ userId: 'user-1', position: 1 });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_rotation', () => {
    it('calls PATCH /api/v1/on-call/rotations/{id} with optional fields', async () => {
      const responseData = { id: 'rot-1', name: 'Primary Updated' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_rotation');
      const result = await handler({
        id: 'rot-1',
        name: 'Primary Updated',
        color: '#00ff00',
        type: 'daily',
        intervalDays: 1,
        handoffTime: '08:00',
        activeDays: [1, 2, 3],
        startDate: '2026-02-01',
        timezone: 'UTC',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/rotations/rot-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({
        name: 'Primary Updated',
        color: '#00ff00',
        type: 'daily',
        intervalDays: 1,
        handoffTime: '08:00',
        activeDays: [1, 2, 3],
        startDate: '2026-02-01',
        timezone: 'UTC',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_rotation', () => {
    it('calls DELETE /api/v1/on-call/rotations/{id}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_rotation');
      const result = await handler({ id: 'rot-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/rotations/rot-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('list_rotations', () => {
    it('calls GET /api/v1/on-call/schedules/{scheduleId}/rotations', async () => {
      const responseData = [{ id: 'rot-1', name: 'Primary' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_rotations');
      const result = await handler({ scheduleId: 'sched-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/schedules/sched-1/rotations');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_rotation', () => {
    it('calls POST /api/v1/on-call/schedules/{scheduleId}/rotations with required and optional fields', async () => {
      const responseData = { id: 'rot-1', name: 'Primary' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_rotation');
      const result = await handler({
        scheduleId: 'sched-1',
        name: 'Primary',
        color: '#ff0000',
        type: 'weekly',
        intervalDays: 7,
        handoffTime: '09:00',
        activeDays: [1, 2, 3, 4, 5],
        startDate: '2026-01-01',
        timezone: 'America/Sao_Paulo',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/schedules/sched-1/rotations');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        name: 'Primary',
        color: '#ff0000',
        type: 'weekly',
        intervalDays: 7,
        handoffTime: '09:00',
        activeDays: [1, 2, 3, 4, 5],
        startDate: '2026-01-01',
        timezone: 'America/Sao_Paulo',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // ─── Schedules ────────────────────────────────────────────────────────────

  describe('delete_schedule_override', () => {
    it('calls DELETE /api/v1/on-call/schedules/overrides/{overrideId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_schedule_override');
      const result = await handler({ overrideId: 'override-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/schedules/overrides/override-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('get_who_is_on_call', () => {
    it('calls GET /api/v1/on-call/schedules/{id}/who-is-on-call without at', async () => {
      const responseData = { userId: 'user-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_who_is_on_call');
      const result = await handler({ id: 'sched-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/schedules/sched-1/who-is-on-call');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/on-call/schedules/{id}/who-is-on-call with at', async () => {
      const responseData = { userId: 'user-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_who_is_on_call');
      const result = await handler({ id: 'sched-1', at: '2026-01-15T09:00:00Z' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/schedules/sched-1/who-is-on-call?at=2026-01-15T09%3A00%3A00Z');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_schedule_overrides', () => {
    it('calls GET /api/v1/on-call/schedules/{id}/overrides', async () => {
      const responseData = [{ id: 'override-1', userId: 'user-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_schedule_overrides');
      const result = await handler({ id: 'sched-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/schedules/sched-1/overrides');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_schedule_override', () => {
    it('calls POST /api/v1/on-call/schedules/{id}/overrides with required and optional fields', async () => {
      const responseData = { id: 'override-1', userId: 'user-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_schedule_override');
      const result = await handler({
        id: 'sched-1',
        userId: 'user-1',
        startAt: '2026-01-15T09:00:00Z',
        endAt: '2026-01-16T09:00:00Z',
        reason: 'Vacation cover',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/schedules/sched-1/overrides');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        userId: 'user-1',
        startAt: '2026-01-15T09:00:00Z',
        endAt: '2026-01-16T09:00:00Z',
        reason: 'Vacation cover',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_oncall_schedules', () => {
    it('calls GET /api/v1/on-call/schedules', async () => {
      const responseData = [{ id: 'sched-1', name: 'Primary Schedule' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_oncall_schedules');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/schedules');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_oncall_schedule', () => {
    it('calls GET /api/v1/on-call/schedules/{id}', async () => {
      const responseData = { id: 'sched-1', name: 'Primary Schedule' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_oncall_schedule');
      const result = await handler({ id: 'sched-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/schedules/sched-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_oncall_schedule', () => {
    it('calls PATCH /api/v1/on-call/schedules/{id} with optional fields', async () => {
      const responseData = { id: 'sched-1', description: 'Updated', timezone: 'UTC' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_oncall_schedule');
      const result = await handler({ id: 'sched-1', description: 'Updated', timezone: 'UTC' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/schedules/sched-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ description: 'Updated', timezone: 'UTC' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // ─── Error handling ───────────────────────────────────────────────────────

  describe('error handling', () => {
    it('returns error text on API error instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Map(),
        json: async () => ({ message: 'Forbidden' }),
      });

      const handler = getToolHandler(server, 'get_oncall_alerts_stats');
      const result = await handler({});

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error 403: {"message":"Forbidden"}' }],
      });
    });
  });
});
