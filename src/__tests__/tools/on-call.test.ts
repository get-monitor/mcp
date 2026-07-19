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

  // ─── Teams ────────────────────────────────────────────────────────────────

  describe('list_oncall_teams', () => {
    it('calls GET /api/v1/on-call/teams', async () => {
      const responseData = [{ id: 'team-1', name: 'Alpha Team' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_oncall_teams');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_oncall_team', () => {
    it('calls POST /api/v1/on-call/teams with body', async () => {
      const responseData = { id: 'team-1', name: 'Alpha Team' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_oncall_team');
      const result = await handler({ name: 'Alpha Team' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ name: 'Alpha Team' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_oncall_team', () => {
    it('calls GET /api/v1/on-call/teams/{teamId}', async () => {
      const responseData = { id: 'team-1', name: 'Alpha Team' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_oncall_team');
      const result = await handler({ teamId: 'team-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_oncall_team', () => {
    it('calls PATCH /api/v1/on-call/teams/{teamId} with body', async () => {
      const responseData = { id: 'team-1', name: 'Beta Team' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_oncall_team');
      const result = await handler({ teamId: 'team-1', body: { name: 'Beta Team' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ name: 'Beta Team' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_oncall_team', () => {
    it('calls DELETE /api/v1/on-call/teams/{teamId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_oncall_team');
      const result = await handler({ teamId: 'team-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  // ─── Team Members ─────────────────────────────────────────────────────────

  describe('add_oncall_team_member', () => {
    it('calls POST /api/v1/on-call/teams/{teamId}/members with body', async () => {
      const responseData = { id: 'member-1', userId: 'user-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'add_oncall_team_member');
      const result = await handler({ teamId: 'team-1', body: { userId: 'user-1' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1/members');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ userId: 'user-1' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_oncall_team_member', () => {
    it('calls PATCH /api/v1/on-call/teams/{teamId}/members/{memberId} with body', async () => {
      const responseData = { id: 'member-1', role: 'responder' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_oncall_team_member');
      const result = await handler({ teamId: 'team-1', memberId: 'member-1', body: { role: 'responder' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1/members/member-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ role: 'responder' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('remove_oncall_team_member', () => {
    it('calls DELETE /api/v1/on-call/teams/{teamId}/members/{memberId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'remove_oncall_team_member');
      const result = await handler({ teamId: 'team-1', memberId: 'member-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1/members/member-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('activate_oncall_team_member', () => {
    it('calls POST /api/v1/on-call/teams/{teamId}/members/{memberId}/activate with empty body', async () => {
      const responseData = { id: 'member-1', active: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'activate_oncall_team_member');
      const result = await handler({ teamId: 'team-1', memberId: 'member-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1/members/member-1/activate');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  // ─── Channels ─────────────────────────────────────────────────────────────

  describe('list_oncall_channels', () => {
    it('calls GET /api/v1/on-call/teams/{teamId}/channels', async () => {
      const responseData = [{ id: 'channel-1', type: 'email' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_oncall_channels');
      const result = await handler({ teamId: 'team-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1/channels');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('add_oncall_channel', () => {
    it('calls POST /api/v1/on-call/teams/{teamId}/channels with body', async () => {
      const responseData = { id: 'channel-1', type: 'slack' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'add_oncall_channel');
      const result = await handler({ teamId: 'team-1', body: { type: 'slack', webhook: 'https://hooks.slack.com/...' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1/channels');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_oncall_channel', () => {
    it('calls PATCH /api/v1/on-call/teams/{teamId}/channels/{channelId} with body', async () => {
      const responseData = { id: 'channel-1', type: 'slack' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_oncall_channel');
      const result = await handler({ teamId: 'team-1', channelId: 'channel-1', body: { enabled: false } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1/channels/channel-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ enabled: false });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_oncall_channel', () => {
    it('calls DELETE /api/v1/on-call/teams/{teamId}/channels/{channelId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_oncall_channel');
      const result = await handler({ teamId: 'team-1', channelId: 'channel-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/teams/team-1/channels/channel-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  // ─── Policies ─────────────────────────────────────────────────────────────

  describe('list_oncall_policies', () => {
    it('calls GET /api/v1/on-call/policies', async () => {
      const responseData = [{ id: 'policy-1', name: 'Default Policy' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_oncall_policies');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/policies');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_oncall_policy', () => {
    it('calls POST /api/v1/on-call/policies with body', async () => {
      const responseData = { id: 'policy-1', name: 'Escalation Policy' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_oncall_policy');
      const result = await handler({ name: 'Escalation Policy', thresholdMinutes: 5 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/policies');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toMatchObject({ name: 'Escalation Policy' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_oncall_policy_type_counts', () => {
    it('calls GET /api/v1/on-call/policies/type-counts', async () => {
      const responseData = { escalation: 3, rotation: 2 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_oncall_policy_type_counts');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/policies/type-counts');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_oncall_policy', () => {
    it('calls GET /api/v1/on-call/policies/{policyId}', async () => {
      const responseData = { id: 'policy-1', name: 'Default Policy' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_oncall_policy');
      const result = await handler({ policyId: 'policy-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/policies/policy-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_oncall_policy', () => {
    it('calls PATCH /api/v1/on-call/policies/{policyId} with body', async () => {
      const responseData = { id: 'policy-1', name: 'Updated Policy' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_oncall_policy');
      const result = await handler({ policyId: 'policy-1', body: { name: 'Updated Policy' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/policies/policy-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ name: 'Updated Policy' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_oncall_policy', () => {
    it('calls DELETE /api/v1/on-call/policies/{policyId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'delete_oncall_policy');
      const result = await handler({ policyId: 'policy-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/policies/policy-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  // ─── Monitor-Policy Assignment ────────────────────────────────────────────

  describe('list_monitor_oncall_policies', () => {
    it('calls GET /api/v1/on-call/monitors/{monitorId}/policies', async () => {
      const responseData = [{ id: 'policy-1', enabled: true }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_monitor_oncall_policies');
      const result = await handler({ monitorId: 'monitor-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/monitors/monitor-1/policies');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('assign_oncall_policy', () => {
    it('calls POST /api/v1/on-call/monitors/{monitorId}/policies with body', async () => {
      const responseData = { monitorId: 'monitor-1', policyId: 'policy-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'assign_oncall_policy');
      const result = await handler({ monitorId: 'monitor-1', body: { policyId: 'policy-1' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/monitors/monitor-1/policies');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ policyId: 'policy-1' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('toggle_oncall_policy', () => {
    it('calls PATCH /api/v1/on-call/monitors/{monitorId}/policies/{policyId} with body', async () => {
      const responseData = { monitorId: 'monitor-1', policyId: 'policy-1', enabled: false };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'toggle_oncall_policy');
      const result = await handler({ monitorId: 'monitor-1', policyId: 'policy-1', body: { enabled: false } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/monitors/monitor-1/policies/policy-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ enabled: false });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('unassign_oncall_policy', () => {
    it('calls DELETE /api/v1/on-call/monitors/{monitorId}/policies/{policyId}', async () => {
      mockFetch.mockResolvedValueOnce(mockEmpty());

      const handler = getToolHandler(server, 'unassign_oncall_policy');
      const result = await handler({ monitorId: 'monitor-1', policyId: 'policy-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/monitors/monitor-1/policies/policy-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  // ─── Graph, Migration, Notifications ─────────────────────────────────────

  describe('get_oncall_graph', () => {
    it('calls GET /api/v1/on-call/graph', async () => {
      const responseData = { nodes: [], edges: [] };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_oncall_graph');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/graph');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('migrate_oncall', () => {
    it('calls POST /api/v1/on-call/migrate with empty body', async () => {
      const responseData = { migrated: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'migrate_oncall');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/migrate');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_oncall_notifications', () => {
    it('calls GET /api/v1/on-call/notifications without filters', async () => {
      const responseData = [{ id: 'notif-1', deliveryStatus: 'SENT' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_oncall_notifications');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/on-call/notifications');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/on-call/notifications with all query params', async () => {
      const responseData = [{ id: 'notif-1', deliveryStatus: 'FAILED' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_oncall_notifications');
      const result = await handler({ limit: 10, page: 2, deliveryStatus: 'FAILED', monitorId: 'monitor-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('limit=10');
      expect(url).toContain('page=2');
      expect(url).toContain('deliveryStatus=FAILED');
      expect(url).toContain('monitorId=monitor-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

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

  // ─── Error handling ───────────────────────────────────────────────────────

  describe('error handling', () => {
    it('returns error text on API error instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Map(),
        json: async () => ({ message: 'Forbidden' }),
      });

      const handler = getToolHandler(server, 'get_oncall_team');
      const result = await handler({ teamId: 'team-1' });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error 403: {"message":"Forbidden"}' }],
      });
    });
  });
});
