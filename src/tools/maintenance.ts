import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import type { ToolResponse } from './status-pages.js';

function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}

function formatMaintenance(m: Record<string, unknown>): string {
  return [
    `ID: ${m.id}`,
    `Title: ${m.title}`,
    `Status: ${m.status}`,
    m.scheduledStartAt ? `Scheduled Start: ${m.scheduledStartAt}` : null,
    m.scheduledEndAt ? `Scheduled End: ${m.scheduledEndAt}` : null,
    m.description ? `Description: ${m.description}` : null,
  ].filter(Boolean).join('\n');
}

export async function listMaintenance(
  client: GetMonitorClient,
  statusPageId: string,
  params: { status?: string; startDate?: string; endDate?: string },
): Promise<ToolResponse> {
  const data = await client.get<Record<string, unknown>[] | Record<string, unknown>>(
    `/api/v1/status-pages/${statusPageId}/maintenance`,
    {
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
    },
  );
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return text('No maintenance windows found.');
  return text(items.map(formatMaintenance).join('\n\n---\n\n'));
}

export async function getMaintenance(
  client: GetMonitorClient,
  statusPageId: string,
  maintenanceId: string,
): Promise<ToolResponse> {
  const data = await client.get<Record<string, unknown>>(
    `/api/v1/status-pages/${statusPageId}/maintenance/${maintenanceId}`,
  );
  return text(JSON.stringify(data, null, 2));
}

const ISODate = z.string().datetime({ offset: true }).describe('ISO 8601 datetime, e.g. 2026-05-01T00:00:00Z');

export function registerMaintenanceTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'list_maintenance',
    'List maintenance windows for a status page. Filter by status or date range.',
    {
      statusPageId: z.string(),
      status: z.enum(['scheduled', 'in_progress']).optional()
        .describe('Filter by maintenance status'),
      startDate: ISODate.optional().describe('Start of date range (requires endDate)'),
      endDate: ISODate.optional().describe('End of date range (requires startDate)'),
    },
    ({ statusPageId, ...params }) => listMaintenance(client, statusPageId, params),
  );

  server.tool(
    'get_maintenance',
    'Get a specific maintenance window by ID',
    { statusPageId: z.string(), maintenanceId: z.string() },
    ({ statusPageId, maintenanceId }) => getMaintenance(client, statusPageId, maintenanceId),
  );
}
