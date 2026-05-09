import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerUserTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'check_email',
    'Check whether an email address is available for registration.',
    {
      email: z.string().describe('The email address to check for availability'),
    },
    ({ email }) => callApi(() => client.post('/api/v1/users/check-email', { email })),
  );

  server.tool(
    'create_user_with_organization',
    'Create a new user and associated organization in a single operation.',
    {
      fullName: z.string().describe('Full name of the user'),
      email: z.string().describe('Email address of the user'),
      companyName: z.string().describe('Name of the company/organization to create'),
      language: z.enum(['en-US', 'pt-BR']).optional().describe('Preferred language for the user (en-US or pt-BR)'),
    },
    ({ fullName, email, companyName, language }) =>
      callApi(() => client.post('/api/v1/users/create-with-organization', { fullName, email, companyName, language })),
  );

  server.tool(
    'get_current_user',
    'Get the current authenticated user profile.',
    {},
    () => callApi(() => client.get('/api/v1/users/me')),
  );

  server.tool(
    'update_current_user',
    'Update the current user profile information.',
    {
      name: z.string().optional().describe('Updated full name for the user'),
      image: z.string().optional().describe('Updated profile image URL for the user'),
    },
    ({ name, image }) => callApi(() => client.patch('/api/v1/users/me', { name, image })),
  );

  server.tool(
    'delete_current_user',
    'Delete the current user account.',
    {},
    () => callApi(() => client.delete('/api/v1/users/me')),
  );

  server.tool(
    'update_user_language',
    'Update the language preference for the current user.',
    {
      language: z.enum(['en-US', 'pt-BR']).describe('The language code to set as user preference (en-US or pt-BR)'),
    },
    ({ language }) => callApi(() => client.patch('/api/v1/users/me/language', { language })),
  );

  server.tool(
    'accept_migration',
    'Accept a pending user migration.',
    {},
    () => callApi(() => client.post('/api/v1/users/me/accept-migration', {})),
  );

  server.tool(
    'list_user_sessions',
    'List all active sessions for the current user.',
    {},
    () => callApi(() => client.get('/api/v1/users/me/sessions')),
  );

  server.tool(
    'revoke_all_other_sessions',
    'Revoke all other sessions for the current user, keeping only the current session active.',
    {},
    () => callApi(() => client.delete('/api/v1/users/me/sessions')),
  );

  server.tool(
    'revoke_session',
    'Revoke a specific user session by ID.',
    {
      sessionId: z.string().describe('The session ID to revoke'),
    },
    ({ sessionId }) => callApi(() => client.delete(`/api/v1/users/me/sessions/${sessionId}`)),
  );

  server.tool(
    'list_linked_accounts',
    'List all OAuth accounts linked to the current user.',
    {},
    () => callApi(() => client.get('/api/v1/users/me/accounts')),
  );

  server.tool(
    'unlink_oauth_account',
    'Unlink an OAuth account from the current user.',
    {
      password: z.string().optional().describe('User password for verification'),
      callbackURL: z.string().optional().describe('URL to redirect to after unlinking'),
    },
    ({ password, callbackURL }) => {
      const body = password !== undefined || callbackURL !== undefined ? { password, callbackURL } : undefined;
      return callApi(() => client.delete('/api/v1/users/me/account', body));
    },
  );

  server.tool(
    'get_user',
    'Get details about a specific user by ID.',
    {
      userId: z.string().describe('The user ID'),
    },
    ({ userId }) => callApi(() => client.get(`/api/v1/users/${userId}`)),
  );
}
