// src/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetMonitorClient } from './client/api-client.js';

export function createServer(client: GetMonitorClient): McpServer {
  const server = new McpServer({
    name: 'GetMonitor',
    version: '0.1.0',
  });
  // Tool registrations added in subsequent tasks
  return server;
}
