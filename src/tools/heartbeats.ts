import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerHeartbeatTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'list_heartbeats',
    'List all heartbeat monitors.',
    {
      includeInactive: z.boolean().optional().describe('Include inactive heartbeats in the response'),
    },
    ({ includeInactive }) => {
      const params: Record<string, string | number | boolean | undefined> = {};
      if (includeInactive !== undefined) {
        params.includeInactive = includeInactive;
      }
      return callApi(() => client.get('/api/v1/heartbeats', params));
    },
  );

  server.tool(
    'create_heartbeat',
    'Create a new heartbeat monitor.',
    {
      data: z.record(z.string(), z.unknown()).describe('Heartbeat monitor configuration object'),
    },
    ({ data }) =>
      callApi(() => client.post('/api/v1/heartbeats', data)),
  );

  server.tool(
    'get_heartbeat',
    'Get details about a specific heartbeat monitor.',
    {
      id: z.string().describe('The heartbeat monitor ID'),
    },
    ({ id }) =>
      callApi(() => client.get(`/api/v1/heartbeats/${id}`)),
  );

  server.tool(
    'update_heartbeat',
    'Update a specific heartbeat monitor.',
    {
      id: z.string().describe('The heartbeat monitor ID'),
      data: z.record(z.string(), z.unknown()).describe('Updated heartbeat monitor configuration object'),
    },
    ({ id, data }) =>
      callApi(() => client.patch(`/api/v1/heartbeats/${id}`, data)),
  );

  server.tool(
    'delete_heartbeat',
    'Delete a specific heartbeat monitor.',
    {
      id: z.string().describe('The heartbeat monitor ID'),
    },
    ({ id }) =>
      callApi(() => client.delete(`/api/v1/heartbeats/${id}`)),
  );

  server.tool(
    'regenerate_heartbeat_token',
    'Regenerate the token for a specific heartbeat monitor.',
    {
      id: z.string().describe('The heartbeat monitor ID'),
    },
    ({ id }) =>
      callApi(() => client.post(`/api/v1/heartbeats/${id}/token/regenerate`, {})),
  );

  server.tool(
    'pause_heartbeat',
    'Pause a specific heartbeat monitor.',
    {
      id: z.string().describe('The heartbeat monitor ID'),
      hours: z.number().optional().describe('Number of hours to pause the heartbeat'),
    },
    ({ id, hours }) => {
      const body: Record<string, unknown> = {};
      if (hours !== undefined) {
        body.hours = hours;
      }
      return callApi(() => client.post(`/api/v1/heartbeats/${id}/pause`, body));
    },
  );

  server.tool(
    'unpause_heartbeat',
    'Unpause a specific heartbeat monitor.',
    {
      id: z.string().describe('The heartbeat monitor ID'),
    },
    ({ id }) =>
      callApi(() => client.post(`/api/v1/heartbeats/${id}/unpause`, {})),
  );
}
