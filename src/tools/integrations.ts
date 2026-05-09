import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerIntegrationTools(server: McpServer, client: GetMonitorClient): void {
  // ─── Apps Catalog ────────────────────────────────────────────────────────────

  server.tool(
    'list_integration_apps',
    'List available integration apps in the catalog.',
    {
      appType: z.enum(['source', 'destination']).optional().describe('Filter apps by type (source or destination)'),
    },
    ({ appType }) => callApi(() => client.get('/api/v1/integrations/apps', appType ? { appType } : undefined)),
  );

  server.tool(
    'get_integration_app_counts',
    'Get counts of integration apps grouped by type.',
    {},
    () => callApi(() => client.get('/api/v1/integrations/apps/counts')),
  );

  server.tool(
    'get_integration_app',
    'Get details about a specific integration app.',
    {
      appId: z.string().describe('The integration app ID'),
    },
    ({ appId }) => callApi(() => client.get(`/api/v1/integrations/apps/${appId}`)),
  );

  // ─── Installations ────────────────────────────────────────────────────────────

  server.tool(
    'list_installations',
    'List integration installations, optionally filtered by status, app type, or app ID.',
    {
      status: z
        .enum(['draft', 'active', 'disabled', 'reconnect_required', 'error'])
        .optional()
        .describe('Filter by installation status'),
      appType: z.enum(['source', 'destination']).optional().describe('Filter by app type (source or destination)'),
      appId: z.string().optional().describe('Filter by specific app ID'),
    },
    ({ status, appType, appId }) => {
      const query: Record<string, string> = {};
      if (status) query.status = status;
      if (appType) query.appType = appType;
      if (appId) query.appId = appId;
      return callApi(() => client.get('/api/v1/integrations/installations', Object.keys(query).length ? query : undefined));
    },
  );

  server.tool(
    'create_installation',
    'Create a new integration installation.',
    {
      config: z.record(z.unknown()).describe('Installation configuration object'),
    },
    ({ config }) => callApi(() => client.post('/api/v1/integrations/installations', config)),
  );

  server.tool(
    'get_installation',
    'Get details about a specific integration installation.',
    {
      id: z.string().describe('The installation ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/integrations/installations/${id}`)),
  );

  server.tool(
    'update_installation_config',
    'Update the configuration of an existing integration installation.',
    {
      id: z.string().describe('The installation ID'),
      config: z.record(z.unknown()).describe('Updated configuration fields'),
    },
    ({ id, config }) => callApi(() => client.patch(`/api/v1/integrations/installations/${id}`, config)),
  );

  server.tool(
    'disable_installation',
    'Disable an active integration installation.',
    {
      id: z.string().describe('The installation ID to disable'),
    },
    ({ id }) => callApi(() => client.post(`/api/v1/integrations/installations/${id}/disable`, {})),
  );

  server.tool(
    'get_installation_health',
    'Get the health status of a specific integration installation.',
    {
      id: z.string().describe('The installation ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/integrations/installations/${id}/health`)),
  );

  server.tool(
    'reconnect_installation',
    'Trigger a reconnection attempt for an integration installation.',
    {
      id: z.string().describe('The installation ID to reconnect'),
    },
    ({ id }) => callApi(() => client.post(`/api/v1/integrations/installations/${id}/reconnect`, {})),
  );

  // ─── Destination Configs ──────────────────────────────────────────────────────

  server.tool(
    'list_destination_configs',
    'List all destination configurations for a specific integration installation.',
    {
      id: z.string().describe('The installation ID'),
    },
    ({ id }) => callApi(() => client.get(`/api/v1/integrations/installations/${id}/destination-configs`)),
  );

  server.tool(
    'create_destination_config',
    'Create a new destination configuration for an integration installation.',
    {
      id: z.string().describe('The installation ID'),
      config: z.record(z.unknown()).describe('Destination configuration object'),
    },
    ({ id, config }) =>
      callApi(() => client.post(`/api/v1/integrations/installations/${id}/destination-configs`, config)),
  );

  server.tool(
    'update_destination_config',
    'Update an existing destination configuration.',
    {
      id: z.string().describe('The installation ID'),
      configId: z.string().describe('The destination config ID'),
      config: z.record(z.unknown()).describe('Updated destination configuration fields'),
    },
    ({ id, configId, config }) =>
      callApi(() =>
        client.patch(`/api/v1/integrations/installations/${id}/destination-configs/${configId}`, config),
      ),
  );

  server.tool(
    'delete_destination_config',
    'Delete a destination configuration from an integration installation.',
    {
      id: z.string().describe('The installation ID'),
      configId: z.string().describe('The destination config ID to delete'),
    },
    ({ id, configId }) =>
      callApi(() => client.delete(`/api/v1/integrations/installations/${id}/destination-configs/${configId}`)),
  );

  server.tool(
    'preview_destination_template',
    'Preview the rendered output of a destination template for a given installation.',
    {
      id: z.string().describe('The installation ID'),
      config: z.record(z.unknown()).describe('Template preview configuration'),
    },
    ({ id, config }) =>
      callApi(() =>
        client.post(`/api/v1/integrations/installations/${id}/destination-configs/preview`, config),
      ),
  );

  server.tool(
    'test_destination_config',
    'Send a test event through a destination configuration to verify it is working.',
    {
      id: z.string().describe('The installation ID'),
      configId: z.string().describe('The destination config ID to test'),
    },
    ({ id, configId }) =>
      callApi(() =>
        client.post(`/api/v1/integrations/installations/${id}/destination-configs/${configId}/test`, {}),
      ),
  );
}
