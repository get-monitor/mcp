import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GetMonitorClient } from '../client/api-client.js';
import { callApi, text, type ToolResponse } from './helpers.js';

export function registerOnboardingTools(server: McpServer, client: GetMonitorClient): void {
  server.tool(
    'complete_onboarding',
    'Complete the onboarding process with the provided data.',
    {
      body: z.record(z.string(), z.unknown()).describe('Onboarding data (arbitrary object with organization, monitor, status page, and team invitation details)'),
    },
    ({ body }) =>
      callApi(() => client.post('/api/v1/onboarding/complete', body)),
  );
}
