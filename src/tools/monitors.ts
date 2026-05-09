import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerMonitorTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'list_all_monitors',
    'List all monitors across all types.',
    {},
    () => callApi(() => client.get('/api/v1/monitors')),
  );

  server.tool(
    'get_monitor',
    'Get details about a specific monitor.',
    {
      id: z.string().describe('The monitor ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/monitors/${id}`)),
  );

  server.tool(
    'get_organization_monitor_statistics',
    'Get monitor statistics for an organization.',
    {
      timeRange: z.enum(['24h', '7d', '30d']).optional().describe('Time range for statistics (24h, 7d, or 30d)'),
    },
    ({ timeRange }) => callApi(() => client.get('/api/v1/monitors/organization/statistics', timeRange ? { timeRange } : undefined)),
  );

  server.tool(
    'get_status_page_monitor_statistics',
    'Get monitor statistics for a specific status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
      timeRange: z.enum(['24h', '7d', '30d']).optional().describe('Time range for statistics (24h, 7d, or 30d)'),
    },
    ({ statusPageId, timeRange }) =>
      callApi(() => client.get(`/api/v1/status-pages/${statusPageId}/monitors/statistics`, timeRange ? { timeRange } : undefined)),
  );

  server.tool(
    'list_status_page_uptime_monitors',
    'List uptime monitors for a specific status page.',
    {
      statusPageId: z.string().describe('The status page ID'),
    },
    ({ statusPageId }) => callApi(() => client.get(`/api/v1/status-pages/${statusPageId}/uptime`)),
  );
}
