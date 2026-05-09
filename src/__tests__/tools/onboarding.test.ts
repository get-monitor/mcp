import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerOnboardingTools } from '../../tools/onboarding.js';

// Helper to create a mock fetch response
function mockResponse(data: unknown, status = 200) {
  return {
    ok: true,
    status,
    headers: new Map([['content-length', '100']]),
    json: async () => data,
  };
}

// Helper to find a registered tool handler by name
function getToolHandler(server: McpServer, toolName: string) {
  // Access internal tool registry via the registered tools
  const tools = (server as unknown as { _registeredTools: Record<string, { handler: (args: unknown) => unknown }> })._registeredTools;
  if (!tools || !tools[toolName]) {
    throw new Error(`Tool "${toolName}" not found in server`);
  }
  return tools[toolName].handler;
}

describe('Onboarding Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerOnboardingTools(server, client);
  });

  describe('complete_onboarding', () => {
    it('calls POST /api/v1/onboarding/complete with onboarding data', async () => {
      const responseData = { success: true, organizationId: 'org-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'complete_onboarding');
      const onboardingData = {
        organization: {
          name: 'My Organization',
          slug: 'my-org',
        },
        monitor: {
          name: 'Website Monitor',
          url: 'https://example.com',
        },
        statusPage: {
          title: 'Status Page',
        },
      };

      const result = await handler({
        body: onboardingData,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/onboarding/complete');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toEqual(onboardingData);
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('accepts arbitrary nested object structures', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'complete_onboarding');
      const complexData = {
        organization: {
          name: 'Org Name',
          settings: {
            timezone: 'UTC',
            language: 'en-US',
          },
        },
        monitors: [
          { name: 'Monitor 1', type: 'http' },
          { name: 'Monitor 2', type: 'tcp' },
        ],
        teamInvitations: [
          { email: 'user1@example.com', role: 'admin' },
          { email: 'user2@example.com', role: 'member' },
        ],
        customField: 'custom value',
        numericField: 42,
        booleanField: true,
        nullField: null,
      };

      const result = await handler({
        body: complexData,
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toEqual(complexData);
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('accepts empty object', async () => {
      const responseData = { success: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'complete_onboarding');
      const result = await handler({
        body: {},
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });
});
