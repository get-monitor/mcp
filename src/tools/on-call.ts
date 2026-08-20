import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerOnCallTools(server: McpServer, client: GetMonitorClient): void {
  // ─── Alerts ───────────────────────────────────────────────────────────────

  server.tool(
    'get_oncall_alerts_stats',
    'Get counts of on-call alerts sent in a time window, split by source (monitor vs external integration).',
    {
      window: z.enum(['24h']).optional().describe('Time window (currently only 24h is supported)'),
    },
    ({ window }) =>
      callApi(() => client.get('/api/v1/on-call/alerts/stats', { window: window ?? '24h' })),
  );

  server.tool(
    'list_oncall_alerts',
    'List on-call alerts, optionally filtered by lifecycle status.',
    {
      lifecycleStatus: z.string().optional().describe('Filter alerts by lifecycle status'),
    },
    ({ lifecycleStatus }) =>
      callApi(() => client.get('/api/v1/on-call/alerts', { lifecycleStatus })),
  );

  server.tool(
    'acknowledge_oncall_alert',
    'Acknowledge an on-call alert.',
    {
      id: z.string().describe('The on-call alert ID'),
    },
    ({ id }) => callApi(() => client.patch(`/api/v1/on-call/alerts/${id}/acknowledge`, {})),
  );

  server.tool(
    'resolve_oncall_alert',
    'Resolve an on-call alert.',
    {
      id: z.string().describe('The on-call alert ID'),
    },
    ({ id }) => callApi(() => client.patch(`/api/v1/on-call/alerts/${id}/resolve`, {})),
  );

  // ─── Routes ───────────────────────────────────────────────────────────────

  server.tool(
    'list_oncall_routes',
    'List on-call routes for a given source (monitor or integration installation).',
    {
      sourceType: z.string().describe('The source type (e.g. monitor, integration_installation)'),
      sourceId: z.string().describe('The source ID'),
    },
    ({ sourceType, sourceId }) =>
      callApi(() => client.get('/api/v1/on-call/routes', { sourceType, sourceId })),
  );

  server.tool(
    'create_oncall_route',
    'Create a new on-call route, mapping a source to a schedule.',
    {
      sourceType: z
        .enum(['monitor', 'integration_installation'])
        .describe('The source type'),
      sourceId: z.string().describe('The source ID'),
      scheduleId: z.string().describe('The on-call schedule ID to route to'),
    },
    ({ sourceType, sourceId, scheduleId }) =>
      callApi(() => client.post('/api/v1/on-call/routes', { sourceType, sourceId, scheduleId })),
  );

  server.tool(
    'delete_oncall_route',
    'Delete an on-call route.',
    {
      id: z.string().describe('The on-call route ID'),
    },
    ({ id }) => callApi(() => client.delete(`/api/v1/on-call/routes/${id}`)),
  );

  // ─── Rotations ────────────────────────────────────────────────────────────

  server.tool(
    'update_rotation_member',
    'Update a rotation member.',
    {
      id: z.string().describe('The rotation member ID'),
      position: z.number().optional().describe('New position of the member within the rotation'),
    },
    ({ id, ...rest }) => callApi(() => client.patch(`/api/v1/on-call/rotation-members/${id}`, rest)),
  );

  server.tool(
    'remove_rotation_member',
    'Remove a member from a rotation.',
    {
      id: z.string().describe('The rotation member ID'),
    },
    ({ id }) => callApi(() => client.delete(`/api/v1/on-call/rotation-members/${id}`)),
  );

  server.tool(
    'add_rotation_member',
    'Add a member to a rotation.',
    {
      id: z.string().describe('The rotation ID'),
      userId: z.string().describe('The user ID to add to the rotation'),
      position: z.number().optional().describe('Position of the member within the rotation'),
    },
    ({ id, ...rest }) => callApi(() => client.post(`/api/v1/on-call/rotations/${id}/members`, rest)),
  );

  server.tool(
    'update_rotation',
    'Update an existing rotation.',
    {
      id: z.string().describe('The rotation ID'),
      name: z.string().optional().describe('Display name for the rotation'),
      color: z.string().optional().describe('Color used to represent the rotation'),
      type: z.enum(['daily', 'weekly', 'custom']).optional().describe('Rotation cadence type'),
      intervalDays: z.number().optional().describe('Number of days between handoffs'),
      handoffTime: z.string().optional().describe('Time of day when handoff occurs (HH:mm)'),
      activeDays: z.array(z.number()).optional().describe('Days of the week the rotation is active (0-6)'),
      startDate: z.string().optional().describe('Date the rotation starts (ISO 8601)'),
      timezone: z.string().optional().describe('IANA timezone for the rotation'),
    },
    ({ id, ...rest }) => callApi(() => client.patch(`/api/v1/on-call/rotations/${id}`, rest)),
  );

  server.tool(
    'delete_rotation',
    'Delete a rotation.',
    {
      id: z.string().describe('The rotation ID'),
    },
    ({ id }) => callApi(() => client.delete(`/api/v1/on-call/rotations/${id}`)),
  );

  server.tool(
    'list_rotations',
    'List rotations for an on-call schedule.',
    {
      scheduleId: z.string().describe('The on-call schedule ID'),
    },
    ({ scheduleId }) => callApi(() => client.get(`/api/v1/on-call/schedules/${scheduleId}/rotations`)),
  );

  server.tool(
    'create_rotation',
    'Create a new rotation on an on-call schedule.',
    {
      scheduleId: z.string().describe('The on-call schedule ID'),
      name: z.string().describe('Display name for the rotation'),
      color: z.string().optional().describe('Color used to represent the rotation'),
      type: z.enum(['daily', 'weekly', 'custom']).optional().describe('Rotation cadence type'),
      intervalDays: z.number().optional().describe('Number of days between handoffs'),
      handoffTime: z.string().optional().describe('Time of day when handoff occurs (HH:mm)'),
      activeDays: z.array(z.number()).optional().describe('Days of the week the rotation is active (0-6)'),
      startDate: z.string().describe('Date the rotation starts (ISO 8601)'),
      timezone: z.string().optional().describe('IANA timezone for the rotation'),
    },
    ({ scheduleId, ...rest }) =>
      callApi(() => client.post(`/api/v1/on-call/schedules/${scheduleId}/rotations`, rest)),
  );

  // ─── Schedules ────────────────────────────────────────────────────────────

  server.tool(
    'delete_schedule_override',
    'Delete an on-call schedule override.',
    {
      oid: z.string().describe('The schedule override ID'),
    },
    ({ oid }) => callApi(() => client.delete(`/api/v1/on-call/schedules/overrides/${oid}`)),
  );

  server.tool(
    'get_who_is_on_call',
    'Get the user currently on call for a schedule, optionally at a specific point in time.',
    {
      id: z.string().describe('The on-call schedule ID'),
      at: z.string().optional().describe('ISO 8601 timestamp to check who was/will be on call at that time'),
    },
    ({ id, at }) => callApi(() => client.get(`/api/v1/on-call/schedules/${id}/who-is-on-call`, { at })),
  );

  server.tool(
    'list_schedule_overrides',
    'List overrides for an on-call schedule.',
    {
      id: z.string().describe('The on-call schedule ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/on-call/schedules/${id}/overrides`)),
  );

  server.tool(
    'create_schedule_override',
    'Create an override for an on-call schedule.',
    {
      id: z.string().describe('The on-call schedule ID'),
      userId: z.string().describe('The user ID who will be on call during the override'),
      startAt: z.string().describe('ISO 8601 timestamp when the override starts'),
      endAt: z.string().describe('ISO 8601 timestamp when the override ends'),
      reason: z.string().optional().describe('Optional reason for the override'),
    },
    ({ id, ...rest }) => callApi(() => client.post(`/api/v1/on-call/schedules/${id}/overrides`, rest)),
  );

  server.tool(
    'list_oncall_schedules',
    'List all on-call schedules.',
    {},
    () => callApi(() => client.get('/api/v1/on-call/schedules')),
  );

  server.tool(
    'get_oncall_schedule',
    'Get details of a specific on-call schedule.',
    {
      id: z.string().describe('The on-call schedule ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/on-call/schedules/${id}`)),
  );

  server.tool(
    'update_oncall_schedule',
    'Update an existing on-call schedule.',
    {
      id: z.string().describe('The on-call schedule ID'),
      description: z.string().optional().describe('Description of the schedule'),
      timezone: z.string().optional().describe('IANA timezone for the schedule'),
    },
    ({ id, ...rest }) => callApi(() => client.patch(`/api/v1/on-call/schedules/${id}`, rest)),
  );
}
