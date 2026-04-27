import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import type { ToolResponse } from './status-pages.js';

function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}

function formatMonitor(m: Record<string, unknown>): string {
  return [
    `ID: ${m.id}`,
    `Name: ${m.name}`,
    `Status: ${m.status}`,
  ].filter(Boolean).join('\n');
}

export async function listMonitors(client: GetMonitorClient, statusPageId: string): Promise<ToolResponse> {
  const data = await client.get<Record<string, unknown>[]>(`/api/v1/status-pages/${statusPageId}/monitors`);
  if (!data || data.length === 0) return text('No monitors found for this status page.');
  return text(data.map(formatMonitor).join('\n\n---\n\n'));
}

export async function getMonitorAggregations(
  client: GetMonitorClient,
  statusPageId: string,
  monitorId: string,
  date: string,
): Promise<ToolResponse> {
  const data = await client.get<Record<string, unknown>>(
    `/api/v1/status-pages/${statusPageId}/monitors/${monitorId}/aggregations`,
    { date },
  );
  return text(JSON.stringify(data, null, 2));
}

export function registerMonitorTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'list_monitors',
    'List all monitors attached to a status page with their current status',
    { statusPageId: z.string().describe('Status page ID') },
    ({ statusPageId }) => listMonitors(client, statusPageId),
  );

  server.tool(
    'get_monitor_aggregations',
    'Get hourly uptime aggregations (per region) for a specific monitor on a given date',
    {
      statusPageId: z.string().describe('Status page ID'),
      monitorId: z.string().describe('Monitor ID'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Date in YYYY-MM-DD format, e.g. 2024-01-15'),
    },
    ({ statusPageId, monitorId, date }) => getMonitorAggregations(client, statusPageId, monitorId, date),
  );
}
