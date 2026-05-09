import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerUptimeTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'list_uptime_monitors',
    'List all uptime monitors.',
    {
      include: z.string().optional().describe('Optional include parameter (e.g., "metrics")'),
    },
    ({ include }) =>
      callApi(() => client.get('/api/v1/uptime', include ? { include } : {})),
  );

  server.tool(
    'create_uptime_monitor',
    'Create a new uptime monitor.',
    {
      data: z.record(z.string(), z.unknown()).describe('Uptime monitor configuration object'),
    },
    ({ data }) =>
      callApi(() => client.post('/api/v1/uptime', data)),
  );

  server.tool(
    'get_uptime_monitor',
    'Get details about a specific uptime monitor.',
    {
      id: z.string().describe('The uptime monitor ID'),
    },
    ({ id }) =>
      callApi(() => client.get(`/api/v1/uptime/${id}`)),
  );

  server.tool(
    'update_uptime_monitor',
    'Update a specific uptime monitor.',
    {
      id: z.string().describe('The uptime monitor ID'),
      data: z.record(z.string(), z.unknown()).describe('Updated uptime monitor configuration object'),
    },
    ({ id, data }) =>
      callApi(() => client.patch(`/api/v1/uptime/${id}`, data)),
  );

  server.tool(
    'delete_uptime_monitor',
    'Delete a specific uptime monitor.',
    {
      id: z.string().describe('The uptime monitor ID'),
    },
    ({ id }) =>
      callApi(() => client.delete(`/api/v1/uptime/${id}`)),
  );

  server.tool(
    'get_uptime_monitor_statistics',
    'Get statistics for a specific uptime monitor.',
    {
      id: z.string().describe('The uptime monitor ID'),
      timeRange: z.enum(['24h', '7d']).optional().describe('Time range for statistics (24h or 7d)'),
    },
    ({ id, timeRange }) =>
      callApi(() => client.get(`/api/v1/uptime/${id}/statistics`, timeRange ? { timeRange } : {})),
  );

  server.tool(
    'get_uptime_logs',
    'Get uptime logs for a specific uptime monitor.',
    {
      id: z.string().describe('The uptime monitor ID'),
      dateTo: z.string().optional().describe('End date for logs'),
      dateFrom: z.string().optional().describe('Start date for logs'),
      region: z.string().optional().describe('Filter by region(s), comma-separated'),
      status: z.string().optional().describe('Filter by status(es), comma-separated (UP, DOWN, UNKNOWN)'),
      limit: z.number().optional().describe('Maximum number of logs to return'),
      cursor: z.string().optional().describe('Pagination cursor'),
    },
    ({ id, dateTo, dateFrom, region, status, limit, cursor }) => {
      const queryParams: Record<string, string | number | boolean | undefined> = {};
      if (dateTo) queryParams.dateTo = dateTo;
      if (dateFrom) queryParams.dateFrom = dateFrom;
      if (region) queryParams.region = region;
      if (status) queryParams.status = status;
      if (limit !== undefined) queryParams.limit = limit;
      if (cursor) queryParams.cursor = cursor;
      return callApi(() => client.get(`/api/v1/uptime/${id}/uptime-logs`, queryParams));
    },
  );
}
