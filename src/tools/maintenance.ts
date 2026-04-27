import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import type { ToolResponse } from './status-pages.js';

function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}

function formatMaintenance(m: Record<string, unknown>): string {
  const updates = (m.updates as unknown[]) ?? [];
  return [
    `ID: ${m.id}`,
    `Title: ${m.title}`,
    `Status: ${m.status}`,
    m.scheduledStartAt ? `Scheduled Start: ${m.scheduledStartAt}` : null,
    m.scheduledEndAt ? `Scheduled End: ${m.scheduledEndAt}` : null,
    m.actualStartAt ? `Actual Start: ${m.actualStartAt}` : null,
    m.actualEndAt ? `Actual End: ${m.actualEndAt}` : null,
    m.description ? `Description: ${m.description}` : null,
    updates.length > 0 ? `Updates: ${updates.length}` : null,
  ].filter(Boolean).join('\n');
}

interface MaintenanceListResponse {
  items: Record<string, unknown>[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export async function listMaintenance(
  client: GetMonitorClient,
  statusPageId: string,
  params: { status?: string; startDate?: string; endDate?: string; page?: number; limit?: number },
): Promise<ToolResponse> {
  const data = await client.get<MaintenanceListResponse | Record<string, unknown>[]>(
    `/api/v1/status-pages/${statusPageId}/maintenance`,
    {
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page?.toString(),
      limit: params.limit?.toString(),
    },
  );
  // API returns a bare array when startDate+endDate are both provided, paginated object otherwise
  const items: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : (data as MaintenanceListResponse).items ?? [];
  if (items.length === 0) return text('No maintenance windows found.');
  const paginated = !Array.isArray(data) ? (data as MaintenanceListResponse) : null;
  const footer = paginated
    ? `\n\nPage ${paginated.page} of ${Math.ceil(paginated.total / paginated.limit)} (${paginated.total} total)`
    : '';
  return text(items.map(formatMaintenance).join('\n\n---\n\n') + footer);
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
    'List maintenance windows for a status page. Use startDate+endDate for a date-range query (returns a flat array); omit both for paginated results.',
    {
      statusPageId: z.string().describe('Status page ID'),
      status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional()
        .describe('Filter by maintenance status'),
      startDate: ISODate.optional().describe('Start of date range — enables date-range mode (requires endDate)'),
      endDate: ISODate.optional().describe('End of date range — enables date-range mode (requires startDate)'),
      page: z.number().int().positive().default(1).optional().describe('Page number (default 1, ignored in date-range mode)'),
      limit: z.number().int().min(1).max(100).default(20).optional().describe('Results per page (default 20, ignored in date-range mode)'),
    },
    ({ statusPageId, ...params }) => listMaintenance(client, statusPageId, params),
  );

  server.tool(
    'get_maintenance',
    'Get a specific maintenance window by ID, including all updates',
    {
      statusPageId: z.string().describe('Status page ID'),
      maintenanceId: z.string().describe('Maintenance event ID'),
    },
    ({ statusPageId, maintenanceId }) => getMaintenance(client, statusPageId, maintenanceId),
  );
}
