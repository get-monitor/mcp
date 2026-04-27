// src/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetMonitorClient } from './client/api-client.js';
import { registerStatusPageTools } from './tools/status-pages.js';
import { registerMonitorTools } from './tools/monitors.js';
import { registerIncidentTools } from './tools/incidents.js';
import { registerMaintenanceTools } from './tools/maintenance.js';

export function createServer(client: GetMonitorClient): McpServer {
  const server = new McpServer({
    name: 'GetMonitor',
    version: '0.1.0',
  });
  registerStatusPageTools(server, client);
  registerMonitorTools(server, client);
  registerIncidentTools(server, client);
  registerMaintenanceTools(server, client);
  return server;
}
