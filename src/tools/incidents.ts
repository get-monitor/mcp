import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import type { ToolResponse } from './status-pages.js';

function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}

function formatIncident(i: Record<string, unknown>): string {
  const updates = (i.updates as unknown[]) ?? [];
  const affected = (i.affectedMonitors as unknown[]) ?? [];
  return [
    `ID: ${i.id}`,
    `Title: ${i.title}`,
    i.severity ? `Severity: ${i.severity}` : null,
    `Status: ${i.status}`,
    `Started: ${i.startedAt}`,
    i.resolvedAt ? `Resolved: ${i.resolvedAt}` : null,
    i.description ? `Description: ${i.description}` : null,
    affected.length > 0 ? `Affected monitors: ${affected.length}` : null,
    updates.length > 0 ? `Updates: ${updates.length}` : null,
  ].filter(Boolean).join('\n');
}

interface IncidentListResponse {
  items: Record<string, unknown>[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export async function listIncidents(
  client: GetMonitorClient,
  statusPageId: string,
  params: { status?: string; page?: number; limit?: number },
): Promise<ToolResponse> {
  const data = await client.get<IncidentListResponse>(
    `/api/v1/status-pages/${statusPageId}/incidents`,
    {
      status: params.status,
      page: params.page?.toString(),
      limit: params.limit?.toString(),
    },
  );
  const items = data.items ?? [];
  if (items.length === 0) return text('No incidents found.');
  const footer = `\n\nPage ${data.page} of ${Math.ceil(data.total / data.limit)} (${data.total} total)`;
  return text(items.map(formatIncident).join('\n\n---\n\n') + footer);
}

export async function getIncident(
  client: GetMonitorClient,
  statusPageId: string,
  incidentId: string,
): Promise<ToolResponse> {
  const data = await client.get<Record<string, unknown>>(
    `/api/v1/status-pages/${statusPageId}/incidents/${incidentId}`,
  );
  return text(JSON.stringify(data, null, 2));
}

export function registerIncidentTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'list_incidents',
    'List incidents for a status page, optionally filtered by status. Returns paginated results with total count.',
    {
      statusPageId: z.string().describe('Status page ID'),
      status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional()
        .describe('Filter by incident status'),
      page: z.number().int().positive().default(1).optional().describe('Page number (default 1)'),
      limit: z.number().int().min(1).max(100).default(20).optional().describe('Results per page (default 20, max 100)'),
    },
    ({ statusPageId, ...params }) => listIncidents(client, statusPageId, params),
  );

  server.tool(
    'get_incident',
    'Get a specific incident by ID, including all status updates and affected monitors',
    {
      statusPageId: z.string().describe('Status page ID'),
      incidentId: z.string().describe('Incident ID'),
    },
    ({ statusPageId, incidentId }) => getIncident(client, statusPageId, incidentId),
  );
}
