import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerResponseTools } from '../../tools/response.js';

function mockResponse(data: unknown, status = 200) {
  return {
    ok: true,
    status,
    headers: new Map([['content-length', '100']]),
    json: async () => data,
  };
}

function getToolHandler(server: McpServer, toolName: string) {
  const tools = (server as unknown as { _registeredTools: Record<string, { handler: (args: unknown) => unknown }> })._registeredTools;
  if (!tools || !tools[toolName]) throw new Error(`Tool "${toolName}" not found in server`);
  return tools[toolName].handler;
}

describe('Response Incident Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerResponseTools(server, client);
  });

  describe('get_incidents_overview_stats', () => {
    it('calls GET /api/v1/response/incidents/overview-stats', async () => {
      const responseData = {
        mttrMinutes: 42,
        mttrDeltaPct: null,
        incidentsThisMonth: 3,
        incidentsDelta: 1,
        recentIncidents: [{ id: 'i1', title: 'API down', severity: 'sev1', status: 'open', createdAt: '2026-07-19T00:00:00Z', resolvedAt: null }],
      };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_incidents_overview_stats');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/overview-stats');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_incidents', () => {
    it('calls GET /api/v1/response/incidents with filters', async () => {
      const responseData = [{ id: 'inc-1', title: 'DB outage' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_incidents');
      const result = await handler({ status: 'open', severity: 'sev1', page: '1', limit: '20' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe(
        'https://api.example.com/api/v1/response/incidents?status=open&severity=sev1&page=1&limit=20',
      );
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_incident', () => {
    it('calls POST /api/v1/response/incidents with required fields', async () => {
      const responseData = { id: 'inc-1', title: 'DB outage', severity: 'sev2' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_incident');
      const result = await handler({ title: 'DB outage', severity: 'sev2' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ title: 'DB outage', severity: 'sev2' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls POST /api/v1/response/incidents with optional fields including services', async () => {
      const responseData = { id: 'inc-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_incident');
      await handler({
        title: 'DB outage',
        severity: 'sev1',
        summary: 'Primary DB unreachable',
        commanderUserId: 'user-1',
        services: [{ monitorId: 'mon-1', displayName: 'Primary DB' }],
      });

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({
        title: 'DB outage',
        severity: 'sev1',
        summary: 'Primary DB unreachable',
        commanderUserId: 'user-1',
        services: [{ monitorId: 'mon-1', displayName: 'Primary DB' }],
      });
    });
  });

  describe('get_incident', () => {
    it('calls GET /api/v1/response/incidents/{id}', async () => {
      const responseData = { id: 'inc-1', title: 'DB outage' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_incident');
      const result = await handler({ id: 'inc-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_incident', () => {
    it('calls PATCH /api/v1/response/incidents/{id}', async () => {
      const responseData = { id: 'inc-1', title: 'DB outage (updated)' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_incident');
      const result = await handler({
        id: 'inc-1',
        title: 'DB outage (updated)',
        summary: 'Root cause identified',
        severity: 'sev3',
        status: 'identified',
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({
        title: 'DB outage (updated)',
        summary: 'Root cause identified',
        severity: 'sev3',
        status: 'identified',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('resolve_incident', () => {
    it('calls POST /api/v1/response/incidents/{id}/resolve', async () => {
      const responseData = { id: 'inc-1', status: 'resolved' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'resolve_incident');
      const result = await handler({ id: 'inc-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/resolve');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('close_incident', () => {
    it('calls POST /api/v1/response/incidents/{id}/close', async () => {
      const responseData = { id: 'inc-1', status: 'closed' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'close_incident');
      const result = await handler({ id: 'inc-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/close');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('assign_incident_role', () => {
    it('calls POST /api/v1/response/incidents/{id}/roles', async () => {
      const responseData = { id: 'role-1', userId: 'user-1', role: 'commander' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'assign_incident_role');
      const result = await handler({ id: 'inc-1', userId: 'user-1', role: 'commander' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/roles');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ userId: 'user-1', role: 'commander' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('remove_incident_role', () => {
    it('calls DELETE /api/v1/response/incidents/{id}/roles/{roleId}', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'remove_incident_role');
      const result = await handler({ id: 'inc-1', roleId: 'role-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/roles/role-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('add_incident_service', () => {
    it('calls POST /api/v1/response/incidents/{id}/services', async () => {
      const responseData = { id: 'svc-1', displayName: 'Primary DB' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'add_incident_service');
      const result = await handler({ id: 'inc-1', monitorId: 'mon-1', displayName: 'Primary DB' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/services');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ monitorId: 'mon-1', displayName: 'Primary DB' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('remove_incident_service', () => {
    it('calls DELETE /api/v1/response/incidents/{id}/services/{serviceId}', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'remove_incident_service');
      const result = await handler({ id: 'inc-1', serviceId: 'svc-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/services/svc-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('assign_incident_type', () => {
    it('calls PATCH /api/v1/response/incidents/{id}/type', async () => {
      const responseData = { id: 'inc-1', typeId: 'type-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'assign_incident_type');
      const result = await handler({ id: 'inc-1', typeId: 'type-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/type');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ typeId: 'type-1' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('publish_incident_status_update', () => {
    it('calls POST /api/v1/response/incidents/{id}/publish-status-update', async () => {
      const responseData = { id: 'update-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'publish_incident_status_update');
      const result = await handler({
        id: 'inc-1',
        statusPageId: 'sp-1',
        title: 'Investigating',
        body: 'We are looking into it',
        impact: 'major',
        components: [{ monitorId: 'mon-1', status: 'degraded' }],
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/publish-status-update');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        statusPageId: 'sp-1',
        title: 'Investigating',
        body: 'We are looking into it',
        impact: 'major',
        components: [{ monitorId: 'mon-1', status: 'degraded' }],
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_incident_actions', () => {
    it('calls GET /api/v1/response/incidents/{incidentId}/actions', async () => {
      const responseData = [{ id: 'act-1', title: 'Restart DB' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_incident_actions');
      const result = await handler({ incidentId: 'inc-1' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/actions');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_incident_action', () => {
    it('calls POST /api/v1/response/incidents/{incidentId}/actions', async () => {
      const responseData = { id: 'act-1', title: 'Restart DB' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_incident_action');
      const result = await handler({
        incidentId: 'inc-1',
        title: 'Restart DB',
        description: 'Restart the primary DB instance',
        assignedToUserId: 'user-1',
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/actions');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        title: 'Restart DB',
        description: 'Restart the primary DB instance',
        assignedToUserId: 'user-1',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_incident_action', () => {
    it('calls PATCH /api/v1/response/incidents/{incidentId}/actions/{actionId}', async () => {
      const responseData = { id: 'act-1', status: 'completed' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_incident_action');
      const result = await handler({
        incidentId: 'inc-1',
        actionId: 'act-1',
        title: 'Restart DB',
        description: 'Done',
        assignedToUserId: 'user-1',
        status: 'completed',
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/actions/act-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({
        title: 'Restart DB',
        description: 'Done',
        assignedToUserId: 'user-1',
        status: 'completed',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_incident_action', () => {
    it('calls DELETE /api/v1/response/incidents/{incidentId}/actions/{actionId}', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'delete_incident_action');
      const result = await handler({ incidentId: 'inc-1', actionId: 'act-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/actions/act-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('summarize_incident', () => {
    it('calls POST /api/v1/response/incidents/{incidentId}/ai/summarize', async () => {
      const responseData = { summary: 'Database went down due to disk failure.' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'summarize_incident');
      const result = await handler({ incidentId: 'inc-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/ai/summarize');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('draft_incident_status_update', () => {
    it('calls POST /api/v1/response/incidents/{incidentId}/ai/draft-update', async () => {
      const responseData = { draft: 'We are investigating a database outage.' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'draft_incident_status_update');
      const result = await handler({ incidentId: 'inc-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/ai/draft-update');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_custom_field_definitions', () => {
    it('calls GET /api/v1/response/custom-fields', async () => {
      const responseData = [{ id: 'field-1', name: 'Root Cause', fieldType: 'text' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_custom_field_definitions');
      const result = await handler({});

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/custom-fields');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_custom_field_definition', () => {
    it('calls POST /api/v1/response/custom-fields', async () => {
      const responseData = { id: 'field-1', name: 'Root Cause', fieldType: 'text' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_custom_field_definition');
      const result = await handler({
        name: 'Root Cause',
        fieldType: 'select',
        required: true,
        options: ['Hardware', 'Software', 'Network'],
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/custom-fields');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        name: 'Root Cause',
        fieldType: 'select',
        required: true,
        options: ['Hardware', 'Software', 'Network'],
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_custom_field_definition', () => {
    it('calls DELETE /api/v1/response/custom-fields/{fieldId}', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'delete_custom_field_definition');
      const result = await handler({ fieldId: 'field-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/custom-fields/field-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_incident_custom_field_values', () => {
    it('calls GET /api/v1/response/incidents/{incidentId}/custom-fields', async () => {
      const responseData = [{ fieldId: 'field-1', value: 'Hardware' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_incident_custom_field_values');
      const result = await handler({ incidentId: 'inc-1' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/custom-fields');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('set_incident_custom_field_value', () => {
    it('calls PUT /api/v1/response/incidents/{incidentId}/custom-fields/{fieldId}', async () => {
      const responseData = { fieldId: 'field-1', value: 'Hardware' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'set_incident_custom_field_value');
      const result = await handler({ incidentId: 'inc-1', fieldId: 'field-1', value: 'Hardware' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/custom-fields/field-1');
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toEqual({ value: 'Hardware' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_incident_escalations', () => {
    it('calls GET /api/v1/response/incidents/{incidentId}/escalations', async () => {
      const responseData = [{ id: 'esc-1', reason: 'No response from commander' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_incident_escalations');
      const result = await handler({ incidentId: 'inc-1' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/escalations');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_incident_escalation', () => {
    it('calls POST /api/v1/response/incidents/{incidentId}/escalations', async () => {
      const responseData = { id: 'esc-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_incident_escalation');
      const result = await handler({
        incidentId: 'inc-1',
        escalatedToUserId: 'user-2',
        reason: 'No response from commander',
        priority: 'p1',
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/escalations');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        escalatedToUserId: 'user-2',
        reason: 'No response from commander',
        priority: 'p1',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_incident_types', () => {
    it('calls GET /api/v1/response/incident-types', async () => {
      const responseData = [{ id: 'type-1', name: 'Infrastructure' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_incident_types');
      const result = await handler({});

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incident-types');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_incident_type', () => {
    it('calls POST /api/v1/response/incident-types', async () => {
      const responseData = { id: 'type-1', name: 'Infrastructure' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_incident_type');
      const result = await handler({ name: 'Infrastructure', description: 'Hardware and network issues', color: '#ff0000' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incident-types');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        name: 'Infrastructure',
        description: 'Hardware and network issues',
        color: '#ff0000',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_incident_type', () => {
    it('calls PATCH /api/v1/response/incident-types/{typeId}', async () => {
      const responseData = { id: 'type-1', name: 'Infra' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_incident_type');
      const result = await handler({ typeId: 'type-1', name: 'Infra', description: 'Updated', color: '#00ff00' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incident-types/type-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ name: 'Infra', description: 'Updated', color: '#00ff00' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_incident_type', () => {
    it('calls DELETE /api/v1/response/incident-types/{typeId}', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'delete_incident_type');
      const result = await handler({ typeId: 'type-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incident-types/type-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_incident_notebook', () => {
    it('calls POST /api/v1/response/incidents/{incidentId}/notebook', async () => {
      const responseData = { id: 'nb-1', incidentId: 'inc-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_incident_notebook');
      const result = await handler({ incidentId: 'inc-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/notebook');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_incident_notebook', () => {
    it('calls GET /api/v1/response/incidents/{incidentId}/notebook', async () => {
      const responseData = { id: 'nb-1', incidentId: 'inc-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_incident_notebook');
      const result = await handler({ incidentId: 'inc-1' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/notebook');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_incident_participants', () => {
    it('calls GET /api/v1/response/incidents/{incidentId}/participants', async () => {
      const responseData = [{ userId: 'user-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_incident_participants');
      const result = await handler({ incidentId: 'inc-1' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/participants');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('join_incident', () => {
    it('calls POST /api/v1/response/incidents/{incidentId}/participants', async () => {
      const responseData = { userId: 'user-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'join_incident');
      const result = await handler({ incidentId: 'inc-1', userId: 'user-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/participants');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ userId: 'user-1' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('leave_incident', () => {
    it('calls DELETE /api/v1/response/incidents/{incidentId}/participants/{userId}', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'leave_incident');
      const result = await handler({ incidentId: 'inc-1', userId: 'user-1' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/participants/user-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_related_incidents', () => {
    it('calls GET /api/v1/response/incidents/{incidentId}/related', async () => {
      const responseData = [{ id: 'inc-2', relationshipType: 'duplicate' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_related_incidents');
      const result = await handler({ incidentId: 'inc-1' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/related');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('add_related_incident', () => {
    it('calls POST /api/v1/response/incidents/{incidentId}/related', async () => {
      const responseData = { id: 'rel-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'add_related_incident');
      const result = await handler({ incidentId: 'inc-1', relatedIncidentId: 'inc-2', relationshipType: 'duplicate' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/related');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ relatedIncidentId: 'inc-2', relationshipType: 'duplicate' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('remove_related_incident', () => {
    it('calls DELETE /api/v1/response/incidents/{incidentId}/related/{relatedId}', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'remove_related_incident');
      const result = await handler({ incidentId: 'inc-1', relatedId: 'inc-2' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/related/inc-2');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_incident_timeline', () => {
    it('calls GET /api/v1/response/incidents/{incidentId}/timeline with pagination', async () => {
      const responseData = [{ id: 'evt-1', message: 'Incident created' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_incident_timeline');
      const result = await handler({ incidentId: 'inc-1', page: '1', limit: '20' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/timeline?page=1&limit=20');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('add_incident_timeline_note', () => {
    it('calls POST /api/v1/response/incidents/{incidentId}/timeline/notes', async () => {
      const responseData = { id: 'evt-2', message: 'Note added' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'add_incident_timeline_note');
      const result = await handler({ incidentId: 'inc-1', content: 'Restarted the DB service' });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/response/incidents/inc-1/timeline/notes');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ content: 'Restarted the DB service' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
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

      const handler = getToolHandler(server, 'get_incident');
      const result = await handler({ id: 'inc_404' }) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('Error 404');
    });
  });
});
