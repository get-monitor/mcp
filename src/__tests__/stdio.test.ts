import { describe, it, expect } from 'vitest';
import { createServer } from '../server.js';
import { GetMonitorClient } from '../client/api-client.js';

describe('stdio server', () => {
  it('creates server without crashing', () => {
    const client = new GetMonitorClient({ baseUrl: 'https://api.getmonitor.io' });
    const server = createServer(client);
    expect(server).toBeDefined();
  });

  it('registers all tools', () => {
    const client = new GetMonitorClient({ baseUrl: 'https://api.getmonitor.io' });
    const server = createServer(client);
    // The MCP server should have registered tools
    // Access internal state to verify tool count > 100
    const registeredTools = (server as unknown as Record<string, unknown>)._registeredTools;
    expect(typeof registeredTools === 'object').toBe(true);
    const toolCount = Object.keys(registeredTools as object).length;
    expect(toolCount).toBeGreaterThan(100);
  });
});
