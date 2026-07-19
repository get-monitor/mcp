import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerResponseIncidentTools } from '../../tools/response-incidents.js';

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
    registerResponseIncidentTools(server, client);
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
});
