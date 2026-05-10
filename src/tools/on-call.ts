import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerOnCallTools(server: McpServer, client: GetMonitorClient): void {
  // ─── Teams ────────────────────────────────────────────────────────────────

  server.tool(
    'list_oncall_teams',
    'List all on-call teams.',
    {},
    () => callApi(() => client.get('/api/v1/on-call/teams')),
  );

  server.tool(
    'create_oncall_team',
    'Create a new on-call team.',
    {
      name: z.string().describe('Display name for the on-call team'),
      description: z.string().optional().describe('Optional description of the on-call team'),
    },
    ({ name, ...rest }) => callApi(() => client.post('/api/v1/on-call/teams', { name, ...rest })),
  );

  server.tool(
    'get_oncall_team',
    'Get details of a specific on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
    },
    ({ teamId }) => callApi(() => client.get(`/api/v1/on-call/teams/${teamId}`)),
  );

  server.tool(
    'update_oncall_team',
    'Update an existing on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
      body: z.record(z.string(), z.unknown()).describe('Fields to update on the team'),
    },
    ({ teamId, body }) => callApi(() => client.patch(`/api/v1/on-call/teams/${teamId}`, body)),
  );

  server.tool(
    'delete_oncall_team',
    'Delete an on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
    },
    ({ teamId }) => callApi(() => client.delete(`/api/v1/on-call/teams/${teamId}`)),
  );

  // ─── Team Members ─────────────────────────────────────────────────────────

  server.tool(
    'add_oncall_team_member',
    'Add a member to an on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
      body: z.record(z.string(), z.unknown()).describe('Member fields to add'),
    },
    ({ teamId, body }) => callApi(() => client.post(`/api/v1/on-call/teams/${teamId}/members`, body)),
  );

  server.tool(
    'update_oncall_team_member',
    'Update a member of an on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
      memberId: z.string().describe('The member ID'),
      body: z.record(z.string(), z.unknown()).describe('Fields to update on the member'),
    },
    ({ teamId, memberId, body }) =>
      callApi(() => client.patch(`/api/v1/on-call/teams/${teamId}/members/${memberId}`, body)),
  );

  server.tool(
    'remove_oncall_team_member',
    'Remove a member from an on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
      memberId: z.string().describe('The member ID'),
    },
    ({ teamId, memberId }) =>
      callApi(() => client.delete(`/api/v1/on-call/teams/${teamId}/members/${memberId}`)),
  );

  server.tool(
    'activate_oncall_team_member',
    'Activate a member of an on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
      memberId: z.string().describe('The member ID'),
    },
    ({ teamId, memberId }) =>
      callApi(() => client.post(`/api/v1/on-call/teams/${teamId}/members/${memberId}/activate`, {})),
  );

  // ─── Channels ─────────────────────────────────────────────────────────────

  server.tool(
    'list_oncall_channels',
    'List all notification channels for an on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
    },
    ({ teamId }) => callApi(() => client.get(`/api/v1/on-call/teams/${teamId}/channels`)),
  );

  server.tool(
    'add_oncall_channel',
    'Add a notification channel to an on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
      body: z.record(z.string(), z.unknown()).describe('Channel fields to add'),
    },
    ({ teamId, body }) => callApi(() => client.post(`/api/v1/on-call/teams/${teamId}/channels`, body)),
  );

  server.tool(
    'update_oncall_channel',
    'Update a notification channel of an on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
      channelId: z.string().describe('The channel ID'),
      body: z.record(z.string(), z.unknown()).describe('Fields to update on the channel'),
    },
    ({ teamId, channelId, body }) =>
      callApi(() => client.patch(`/api/v1/on-call/teams/${teamId}/channels/${channelId}`, body)),
  );

  server.tool(
    'delete_oncall_channel',
    'Delete a notification channel from an on-call team.',
    {
      teamId: z.string().describe('The on-call team ID'),
      channelId: z.string().describe('The channel ID'),
    },
    ({ teamId, channelId }) =>
      callApi(() => client.delete(`/api/v1/on-call/teams/${teamId}/channels/${channelId}`)),
  );

  // ─── Policies ─────────────────────────────────────────────────────────────

  server.tool(
    'list_oncall_policies',
    'List all on-call policies.',
    {},
    () => callApi(() => client.get('/api/v1/on-call/policies')),
  );

  server.tool(
    'create_oncall_policy',
    'Create a new on-call policy.',
    {
      name: z.string().describe('Display name for the on-call policy'),
      thresholdMinutes: z.number().describe('Number of minutes before escalating'),
      channelType: z
        .enum(['email', 'sms', 'whatsapp', 'webhook', 'slack', 'discord', 'telegram', 'teams'])
        .optional()
        .describe('Notification channel type'),
      config: z.record(z.string(), z.unknown()).optional().describe('Channel-specific configuration object'),
      teamId: z.string().optional().describe('ID of the on-call team to associate with this policy'),
    },
    ({ name, thresholdMinutes, ...rest }) =>
      callApi(() => client.post('/api/v1/on-call/policies', { name, thresholdMinutes, ...rest })),
  );

  server.tool(
    'get_oncall_policy_type_counts',
    'Get counts of on-call policies grouped by type.',
    {},
    () => callApi(() => client.get('/api/v1/on-call/policies/type-counts')),
  );

  server.tool(
    'get_oncall_policy',
    'Get details of a specific on-call policy.',
    {
      policyId: z.string().describe('The on-call policy ID'),
    },
    ({ policyId }) => callApi(() => client.get(`/api/v1/on-call/policies/${policyId}`)),
  );

  server.tool(
    'update_oncall_policy',
    'Update an existing on-call policy.',
    {
      policyId: z.string().describe('The on-call policy ID'),
      body: z.record(z.string(), z.unknown()).describe('Fields to update on the policy'),
    },
    ({ policyId, body }) => callApi(() => client.patch(`/api/v1/on-call/policies/${policyId}`, body)),
  );

  server.tool(
    'delete_oncall_policy',
    'Delete an on-call policy.',
    {
      policyId: z.string().describe('The on-call policy ID'),
    },
    ({ policyId }) => callApi(() => client.delete(`/api/v1/on-call/policies/${policyId}`)),
  );

  // ─── Monitor-Policy Assignment ────────────────────────────────────────────

  server.tool(
    'list_monitor_oncall_policies',
    'List on-call policies assigned to a monitor.',
    {
      monitorId: z.string().describe('The monitor ID'),
    },
    ({ monitorId }) => callApi(() => client.get(`/api/v1/on-call/monitors/${monitorId}/policies`)),
  );

  server.tool(
    'assign_oncall_policy',
    'Assign an on-call policy to a monitor.',
    {
      monitorId: z.string().describe('The monitor ID'),
      body: z.record(z.string(), z.unknown()).describe('Policy assignment fields'),
    },
    ({ monitorId, body }) =>
      callApi(() => client.post(`/api/v1/on-call/monitors/${monitorId}/policies`, body)),
  );

  server.tool(
    'toggle_oncall_policy',
    'Toggle (enable/disable) an on-call policy assigned to a monitor.',
    {
      monitorId: z.string().describe('The monitor ID'),
      policyId: z.string().describe('The on-call policy ID'),
      body: z.record(z.string(), z.unknown()).describe('Toggle fields (e.g. enabled)'),
    },
    ({ monitorId, policyId, body }) =>
      callApi(() => client.patch(`/api/v1/on-call/monitors/${monitorId}/policies/${policyId}`, body)),
  );

  server.tool(
    'unassign_oncall_policy',
    'Unassign an on-call policy from a monitor.',
    {
      monitorId: z.string().describe('The monitor ID'),
      policyId: z.string().describe('The on-call policy ID'),
    },
    ({ monitorId, policyId }) =>
      callApi(() => client.delete(`/api/v1/on-call/monitors/${monitorId}/policies/${policyId}`)),
  );

  // ─── Graph, Migration, Notifications ─────────────────────────────────────

  server.tool(
    'get_oncall_graph',
    'Get the on-call graph showing team and policy relationships.',
    {},
    () => callApi(() => client.get('/api/v1/on-call/graph')),
  );

  server.tool(
    'migrate_oncall',
    'Trigger an on-call configuration migration.',
    {},
    () => callApi(() => client.post('/api/v1/on-call/migrate', {})),
  );

  server.tool(
    'list_oncall_notifications',
    'List on-call notifications with optional filters.',
    {
      limit: z.number().optional().describe('Maximum number of notifications to return'),
      page: z.number().optional().describe('Page number for pagination'),
      deliveryStatus: z
        .enum(['QUEUED', 'PROCESSING', 'SENT', 'FAILED'])
        .optional()
        .describe('Filter by delivery status (QUEUED, PROCESSING, SENT, or FAILED)'),
      monitorId: z.string().optional().describe('Filter notifications by monitor ID'),
    },
    ({ limit, page, deliveryStatus, monitorId }) =>
      callApi(() =>
        client.get('/api/v1/on-call/notifications', { limit, page, deliveryStatus, monitorId }),
      ),
  );
}
