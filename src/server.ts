import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetMonitorClient } from './client/api-client.js';
import { registerOrganizationTools } from './tools/organizations.js';
import { registerUptimeTools } from './tools/uptime.js';
import { registerMonitorTools } from './tools/monitors.js';
import { registerHeartbeatTools } from './tools/heartbeats.js';
import { registerOnCallTools } from './tools/on-call.js';
import { registerResponseIncidentTools } from './tools/response-incidents.js';
import { registerIntegrationTools } from './tools/integrations.js';
import { registerStatusPageTools } from './tools/status-pages.js';
import { registerSubscriptionTools } from './tools/subscriptions.js';

export function createServer(client: GetMonitorClient): McpServer {
  const server = new McpServer({
    name: 'GetMonitor',
    version: '0.1.0',
  });
  registerOrganizationTools(server, client);
  registerUptimeTools(server, client);
  registerMonitorTools(server, client);
  registerHeartbeatTools(server, client);
  registerOnCallTools(server, client);
  registerResponseIncidentTools(server, client);
  registerIntegrationTools(server, client);
  registerStatusPageTools(server, client);
  registerSubscriptionTools(server, client);
  return server;
}
