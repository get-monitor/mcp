import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi } from './helpers.js';

export function registerProjectTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'list_projects',
    'List projects for the organization.',
    {},
    () => callApi(() => client.get('/api/v1/projects')),
  );

  server.tool(
    'create_project',
    'Create a project and its ingestion key.',
    {
      name: z.string().describe('Name of the project'),
    },
    ({ name }) => callApi(() => client.post('/api/v1/projects', { name })),
  );

  server.tool(
    'get_project',
    'Get details about a specific project.',
    {
      projectId: z.string().describe('The project ID'),
    },
    ({ projectId }) => callApi(() => client.get(`/api/v1/projects/${projectId}`)),
  );

  server.tool(
    'update_project',
    'Update a specific project.',
    {
      projectId: z.string().describe('The project ID'),
      name: z.string().describe('Name of the project'),
    },
    ({ projectId, name }) => callApi(() => client.patch(`/api/v1/projects/${projectId}`, { name })),
  );

  server.tool(
    'delete_project',
    'Delete a specific project.',
    {
      projectId: z.string().describe('The project ID'),
    },
    ({ projectId }) => callApi(() => client.delete(`/api/v1/projects/${projectId}`)),
  );

  server.tool(
    'rotate_project_ingestion_key',
    'Rotate the ingestion key for a specific project.',
    {
      projectId: z.string().describe('The project ID'),
    },
    ({ projectId }) => callApi(() => client.post(`/api/v1/projects/${projectId}/ingestion-key/rotate`, {})),
  );

  server.tool(
    'list_source_map_tokens',
    'List source map tokens for a specific project.',
    {
      projectId: z.string().describe('The project ID'),
    },
    ({ projectId }) => callApi(() => client.get(`/api/v1/projects/${projectId}/source-map-tokens`)),
  );

  server.tool(
    'create_source_map_token',
    'Create a source map token for a specific project.',
    {
      projectId: z.string().describe('The project ID'),
      name: z.string().describe('Name of the source map token'),
    },
    ({ projectId, name }) => callApi(() => client.post(`/api/v1/projects/${projectId}/source-map-tokens`, { name })),
  );

  server.tool(
    'revoke_source_map_token',
    'Revoke a source map token for a specific project.',
    {
      projectId: z.string().describe('The project ID'),
      tokenId: z.string().describe('The source map token ID'),
    },
    ({ projectId, tokenId }) => callApi(() => client.delete(`/api/v1/projects/${projectId}/source-map-tokens/${tokenId}`)),
  );
}
