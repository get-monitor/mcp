import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerSubscriptionTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'create_status_page_subscription',
    'Create a new subscription to a public status page.',
    {
      id: z.string().describe('The status page ID'),
      body: z.record(z.string(), z.unknown()).describe('Subscription data (email, phone, etc)'),
    },
    ({ id, body }) =>
      callApi(() => client.post(`/api/v1/status-pages/${id}/subscriptions`, body)),
  );

  server.tool(
    'get_subscription_verification',
    'Get subscription verification details using a verification token.',
    {
      token: z.string().describe('The verification token'),
    },
    ({ token }) =>
      callApi(() => client.get('/api/v1/subscriptions/verifications', { token })),
  );

  server.tool(
    'verify_subscription_token',
    'Verify a subscription token.',
    {
      token: z.string().describe('The subscription token to verify'),
    },
    ({ token }) =>
      callApi(() => client.post('/api/v1/subscriptions/verifications', { token })),
  );

  server.tool(
    'confirm_subscription',
    'Confirm a subscription using a confirmation token.',
    {
      token: z.string().describe('The confirmation token'),
    },
    ({ token }) =>
      callApi(() => client.post('/api/v1/subscriptions/confirmations', { token })),
  );

  server.tool(
    'unsubscribe',
    'Unsubscribe from a status page subscription.',
    {
      body: z.record(z.string(), z.unknown()).describe('Unsubscribe request data'),
    },
    ({ body }) =>
      callApi(() => client.post('/api/v1/subscriptions/unsubscribe', body)),
  );

}
