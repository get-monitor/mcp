import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi } from './helpers.js';

export function registerNotebookTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'list_notebooks',
    'List all notebooks.',
    {
      search: z.string().optional().describe('Search term to filter notebooks by title or content'),
      page: z.string().optional().describe('Page number for pagination'),
      limit: z.string().optional().describe('Number of results per page'),
    },
    ({ search, page, limit }) =>
      callApi(() => client.get('/api/v1/notebooks', { search, page, limit })),
  );

  server.tool(
    'create_notebook',
    'Create a new notebook, optionally from a template.',
    {
      title: z.string().optional().describe('Title for the new notebook'),
      templateKey: z.string().optional().describe('Key of a template to create the notebook from'),
    },
    ({ title, templateKey }) =>
      callApi(() => client.post('/api/v1/notebooks', { title, templateKey })),
  );

  server.tool(
    'ai_draft_notebook',
    'Generate a draft notebook using AI based on a prompt.',
    {
      prompt: z.string().describe('Prompt describing the notebook content to generate'),
    },
    ({ prompt }) =>
      callApi(() => client.post('/api/v1/notebooks/ai-draft', { prompt })),
  );

  server.tool(
    'get_notebook',
    'Get details about a specific notebook.',
    {
      id: z.string().describe('The notebook ID'),
    },
    ({ id }) =>
      callApi(() => client.get(`/api/v1/notebooks/${id}`)),
  );

  server.tool(
    'update_notebook',
    'Update a specific notebook.',
    {
      id: z.string().describe('The notebook ID'),
      title: z.string().optional().describe('Title for the notebook'),
      content: z.string().optional().describe('Content for the notebook'),
    },
    ({ id, ...rest }) =>
      callApi(() => client.patch(`/api/v1/notebooks/${id}`, rest)),
  );

  server.tool(
    'delete_notebook',
    'Delete a specific notebook.',
    {
      id: z.string().describe('The notebook ID'),
    },
    ({ id }) =>
      callApi(() => client.delete(`/api/v1/notebooks/${id}`)),
  );

  server.tool(
    'list_notebook_templates',
    'List all available notebook templates.',
    {},
    () =>
      callApi(() => client.get('/api/v1/notebooks/templates')),
  );
}
