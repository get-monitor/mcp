import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';

export type ToolResponse = { content: Array<{ type: 'text'; text: string }> };

function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}

export async function resolveStatusPage(
  client: GetMonitorClient,
  params: { slug?: string; domain?: string },
): Promise<ToolResponse> {
  const data = await client.get<Record<string, unknown>>('/api/v1/status-pages', {
    slug: params.slug,
    domain: params.domain,
  });
  return text(JSON.stringify(data, null, 2));
}

interface StatusPageStatusResponse {
  status: 'operational' | 'degraded' | 'major_outage' | 'unknown';
  message: string;
  activeIncident: { id: string; title: string; status: string; severity: string; updatedAt: string } | null;
}

export async function getStatusPageStatus(client: GetMonitorClient, id: string): Promise<ToolResponse> {
  const data = await client.get<StatusPageStatusResponse>(`/api/v1/status-pages/${id}/status`);
  const lines = [
    `Status: ${data.status}`,
    `Message: ${data.message}`,
  ];
  if (data.activeIncident) {
    const i = data.activeIncident;
    lines.push(`Active Incident: [${i.severity}] ${i.title} (${i.status}) — ID: ${i.id}`);
  }
  return text(lines.join('\n'));
}

export async function getStatusPageComponents(
  client: GetMonitorClient,
  id: string,
  days?: number,
): Promise<ToolResponse> {
  const data = await client.get<Record<string, unknown>>(
    `/api/v1/status-pages/${id}/components`,
    days !== undefined ? { days: String(days) } : undefined,
  );
  return text(JSON.stringify(data, null, 2));
}

export async function listStatusUpdates(
  client: GetMonitorClient,
  id: string,
  params: { page?: number; limit?: number } = {},
): Promise<ToolResponse> {
  const data = await client.get<Record<string, unknown>>(
    `/api/v1/status-pages/${id}/updates`,
    {
      page: params.page?.toString(),
      limit: params.limit?.toString(),
    },
  );
  return text(JSON.stringify(data, null, 2));
}

export function registerStatusPageTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'resolve_status_page',
    'Find a status page by its slug or custom domain. Returns the status page details including its ID.',
    {
      slug: z.string().optional().describe('Status page slug (subdomain), e.g. "mycompany"'),
      domain: z.string().optional().describe('Full custom domain, e.g. "status.mycompany.com"'),
    },
    (params) => resolveStatusPage(client, params),
  );

  server.tool(
    'get_status_page_status',
    'Get the current aggregate operational status of a status page (operational, degraded, outage, maintenance)',
    { id: z.string().describe('Status page ID') },
    ({ id }) => getStatusPageStatus(client, id),
  );

  server.tool(
    'get_status_page_components',
    'Get the component tree for a status page with uptime percentages and status history. Components may be monitors, static components, or groups.',
    {
      id: z.string().describe('Status page ID'),
      days: z.number().int().min(1).optional().describe('Days of uptime history to include (default 60)'),
    },
    ({ id, days }) => getStatusPageComponents(client, id, days),
  );

  server.tool(
    'list_status_updates',
    'Get a paginated feed of incident and maintenance status updates for a status page, ordered by most recent first.',
    {
      id: z.string().describe('Status page ID'),
      page: z.number().int().positive().default(1).optional().describe('Page number (default 1)'),
      limit: z.number().int().min(1).max(100).default(20).optional().describe('Results per page (default 20)'),
    },
    ({ id, ...params }) => listStatusUpdates(client, id, params),
  );
}
