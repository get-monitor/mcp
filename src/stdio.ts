import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GetMonitorClient } from './client/api-client.js';
import { createServer } from './server.js';

const apiUrl = process.env.GETMONITOR_API_URL ?? 'https://api.getmonitor.io';
const apiKey = process.env.GETMONITOR_API_KEY;
const organizationId = process.env.GETMONITOR_ORGANIZATION_ID;

const client = new GetMonitorClient({ baseUrl: apiUrl, token: apiKey, organizationId });
const server = createServer(client);
const transport = new StdioServerTransport();
await server.connect(transport);
