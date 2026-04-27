// src/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetMonitorClient } from './client/api-client.js';
import { registerStatusPageTools } from './tools/status-pages.js';

export function createServer(client: GetMonitorClient): McpServer {
  const server = new McpServer({
    name: 'GetMonitor',
    version: '0.1.0',
  });
  registerStatusPageTools(server, client);
  return server;
}
