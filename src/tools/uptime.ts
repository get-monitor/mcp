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
      name: z.string().describe('Display name for the monitor'),
      targetUrl: z.string().describe('URL to monitor'),
      checkType: z.enum(['UPTIME', 'CONTENT']).describe('Type of check: UPTIME or CONTENT'),
      followRedirects: z.boolean().describe('Whether to follow HTTP redirects'),
      regions: z.array(z.string()).describe('List of regions to check from'),
      expectedResponseCode: z.string().optional().describe('Expected HTTP response code'),
      contentAlert: z.enum(['NOT_FOUND', 'FOUND']).optional().describe('Content alert type: NOT_FOUND or FOUND'),
      content: z.string().optional().describe('Content string to check for (used with contentAlert)'),
      body: z.record(z.string(), z.unknown()).optional().describe('Request body to send with the check'),
      timeout: z.string().optional().describe('Request timeout (e.g. "30s")'),
      alertSensitivity: z.string().optional().describe('Alert sensitivity level'),
      httpMethod: z.string().optional().describe('HTTP method to use (e.g. GET, POST)'),
      headers: z.array(z.record(z.string(), z.unknown())).optional().describe('HTTP headers to send with the check'),
      username: z.string().optional().describe('Username for basic authentication'),
      password: z.string().optional().describe('Password for basic authentication'),
    },
    ({ name, targetUrl, checkType, followRedirects, regions, ...rest }) =>
      callApi(() => client.post('/api/v1/uptime', { name, targetUrl, checkType, followRedirects, regions, ...rest })),
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
      name: z.string().optional().describe('Display name for the monitor'),
      targetUrl: z.string().optional().describe('URL to monitor'),
      checkType: z.enum(['UPTIME', 'CONTENT']).optional().describe('Type of check: UPTIME or CONTENT'),
      followRedirects: z.boolean().optional().describe('Whether to follow HTTP redirects'),
      regions: z.array(z.string()).optional().describe('List of regions to check from'),
      expectedResponseCode: z.string().optional().describe('Expected HTTP response code'),
      contentAlert: z.enum(['NOT_FOUND', 'FOUND']).optional().describe('Content alert type: NOT_FOUND or FOUND'),
      content: z.string().optional().describe('Content string to check for (used with contentAlert)'),
      body: z.record(z.string(), z.unknown()).optional().describe('Request body to send with the check'),
      timeout: z.string().optional().describe('Request timeout (e.g. "30s")'),
      alertSensitivity: z.string().optional().describe('Alert sensitivity level'),
      httpMethod: z.string().optional().describe('HTTP method to use (e.g. GET, POST)'),
      headers: z.array(z.record(z.string(), z.unknown())).optional().describe('HTTP headers to send with the check'),
      username: z.string().optional().describe('Username for basic authentication'),
      password: z.string().optional().describe('Password for basic authentication'),
    },
    ({ id, ...rest }) =>
      callApi(() => client.patch(`/api/v1/uptime/${id}`, rest)),
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
