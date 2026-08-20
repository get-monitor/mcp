import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi } from './helpers.js';

const contactMethodType = z.enum(['email', 'sms', 'whatsapp', 'slack', 'discord', 'telegram', 'teams', 'webhook']);

export function registerMemberTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'list_member_contact_methods',
    'List all contact methods for the current member.',
    {},
    () => callApi(() => client.get('/api/v1/members/contact-methods')),
  );

  server.tool(
    'create_member_contact_method',
    'Create a new contact method for the current member.',
    {
      type: contactMethodType.describe('The type of contact method'),
      config: z.record(z.string(), z.unknown()).describe('Configuration for the contact method (shape depends on type)'),
      isEnabled: z.boolean().optional().describe('Whether the contact method is enabled'),
    },
    ({ type, config, ...rest }) =>
      callApi(() => client.post('/api/v1/members/contact-methods', { type, config, ...rest })),
  );

  server.tool(
    'update_member_contact_method',
    'Update an existing contact method for the current member.',
    {
      id: z.string().describe('The contact method ID'),
      type: contactMethodType.optional().describe('The type of contact method'),
      config: z.record(z.string(), z.unknown()).optional().describe('Configuration for the contact method (shape depends on type)'),
      isEnabled: z.boolean().optional().describe('Whether the contact method is enabled'),
    },
    ({ id, ...rest }) =>
      callApi(() => client.patch(`/api/v1/members/contact-methods/${id}`, rest)),
  );

  server.tool(
    'remove_member_contact_method',
    'Remove a contact method for the current member.',
    {
      id: z.string().describe('The contact method ID'),
    },
    ({ id }) =>
      callApi(() => client.delete(`/api/v1/members/contact-methods/${id}`)),
  );
}
