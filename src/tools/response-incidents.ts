import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi } from './helpers.js';

export function registerResponseIncidentTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'get_incidents_overview_stats',
    'Get incident-response overview statistics for an organization: MTTR, incident counts, and recent incidents.',
    {},
    () => callApi(() => client.get('/api/v1/response/incidents/overview-stats')),
  );
}
