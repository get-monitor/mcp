import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import type { ToolResponse } from './status-pages.js';

function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}

function formatIncident(i: Record<string, unknown>): string {
  return [
    `ID: ${i.id}`,
    `Title: ${i.title}`,
    i.severity ? `Severity: ${i.severity}` : null,
    `Status: ${i.status}`,
    `Started: ${i.startedAt}`,
    i.resolvedAt ? `Resolved: ${i.resolvedAt}` : null,
  ].filter(Boolean).join('\n');
}

export async function listIncidents(
  client: GetMonitorClient,
  statusPageId: string,
  params: { status?: string; page?: number; limit?: number },
): Promise<ToolResponse> {
  const data = await client.get<{ data?: Record<string, unknown>[] } | Record<string, unknown>[]>(
    `/api/v1/status-pages/${statusPageId}/incidents`,
    {
      status: params.status,
      page: params.page?.toString(),
      limit: params.limit?.toString(),
    },
  );
  const items = Array.isArray(data) ? data : ((data as { data?: Record<string, unknown>[] }).data ?? []);
  if (items.length === 0) return text('No incidents found.');
  return text(items.map(formatIncident).join('\n\n---\n\n'));
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
    'List incidents for a status page, optionally filtered by status',
    {
      statusPageId: z.string().describe('Status page ID'),
      status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
      page: z.number().int().positive().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    },
    ({ statusPageId, ...params }) => listIncidents(client, statusPageId, params),
  );

  server.tool(
    'get_incident',
    'Get a specific incident by ID, including all status updates',
    { statusPageId: z.string(), incidentId: z.string() },
    ({ statusPageId, incidentId }) => getIncident(client, statusPageId, incidentId),
  );
}
