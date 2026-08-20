import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetMonitorClient } from './client/api-client.js';
import { registerOrganizationTools } from './tools/organizations.js';
import { registerUptimeTools } from './tools/uptime.js';
import { registerMonitorTools } from './tools/monitors.js';
import { registerHeartbeatTools } from './tools/heartbeats.js';
import { registerOnCallTools } from './tools/on-call.js';
import { registerResponseTools } from './tools/response.js';
import { registerIntegrationTools } from './tools/integrations.js';
import { registerStatusPageTools } from './tools/status-pages.js';
import { registerSubscriptionTools } from './tools/subscriptions.js';
import { registerProjectTools } from './tools/projects.js';
import { registerNotebookTools } from './tools/notebooks.js';
import { registerMemberTools } from './tools/members.js';

export function createServer(client: GetMonitorClient): McpServer {
  const server = new McpServer({
    name: 'GetMonitor',
    version: '0.3.0',
  });
  registerOrganizationTools(server, client);
  registerUptimeTools(server, client);
  registerMonitorTools(server, client);
  registerHeartbeatTools(server, client);
  registerOnCallTools(server, client);
  registerResponseTools(server, client);
  registerIntegrationTools(server, client);
  registerStatusPageTools(server, client);
  registerSubscriptionTools(server, client);
  registerProjectTools(server, client);
  registerNotebookTools(server, client);
  registerMemberTools(server, client);
  return server;
}
