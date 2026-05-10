import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerSubscriptionTools } from '../../tools/subscriptions.js';

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

describe('Subscription Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerSubscriptionTools(server, client);
  });

  describe('create_status_page_subscription', () => {
    it('calls POST /api/v1/status-pages/{id}/subscriptions with body', async () => {
      const responseData = { id: 'sub-1', email: 'user@example.com' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_status_page_subscription');
      const result = await handler({ id: 'page-1', body: { email: 'user@example.com' } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/status-pages/page-1/subscriptions');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ email: 'user@example.com' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('passes complex body data', async () => {
      const responseData = { id: 'sub-1' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_status_page_subscription');
      const complexBody = { email: 'test@example.com', phone: '+1234567890', channels: ['email', 'sms'] };
      await handler({ id: 'page-1', body: complexBody });

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual(complexBody);
    });
  });

  describe('get_subscription_verification', () => {
    it('calls GET /api/v1/subscriptions/verifications with token query param', async () => {
      const responseData = { verified: true, token: 'token-123' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_subscription_verification');
      const result = await handler({ token: 'verification-token-123' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/subscriptions/verifications');
      expect(url).toContain('token=verification-token-123');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('verify_subscription_token', () => {
    it('calls POST /api/v1/subscriptions/verifications with token body', async () => {
      const responseData = { verified: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'verify_subscription_token');
      const result = await handler({ token: 'token-to-verify' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/subscriptions/verifications');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ token: 'token-to-verify' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('confirm_subscription', () => {
    it('calls POST /api/v1/subscriptions/confirmations with token body', async () => {
      const responseData = { confirmed: true, subscriptionId: 'sub-123' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'confirm_subscription');
      const result = await handler({ token: 'confirmation-token' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/subscriptions/confirmations');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ token: 'confirmation-token' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('unsubscribe', () => {
    it('calls POST /api/v1/subscriptions/unsubscribe with unsubscribe data', async () => {
      const responseData = { unsubscribed: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'unsubscribe');
      const unsubscribeData = { email: 'user@example.com', statusPageId: 'page-1' };
      const result = await handler({ body: unsubscribeData });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/subscriptions/unsubscribe');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(unsubscribeData);
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('passes complex unsubscribe data', async () => {
      const responseData = { unsubscribed: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'unsubscribe');
      const complexData = { email: 'test@example.com', token: 'unsub-token', channels: ['email'] };
      await handler({ body: complexData });

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual(complexData);
    });
  });

  describe('list_subscription_plans', () => {
    it('calls GET /api/v1/subscriptions/plans without query params', async () => {
      const responseData = [{ id: 'plan-1', name: 'Basic' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_subscription_plans');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/subscriptions/plans');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/subscriptions/plans with currency query param', async () => {
      const responseData = [{ id: 'plan-1', currency: 'USD' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_subscription_plans');
      await handler({ currency: 'USD' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/subscriptions/plans');
      expect(url).toContain('currency=USD');
    });

    it('calls GET /api/v1/subscriptions/plans with locale query param', async () => {
      const responseData = [{ id: 'plan-1', locale: 'pt-BR' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_subscription_plans');
      await handler({ locale: 'pt-BR' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/subscriptions/plans');
      expect(url).toContain('locale=pt-BR');
    });

    it('calls GET /api/v1/subscriptions/plans with both currency and locale query params', async () => {
      const responseData = [{ id: 'plan-1', currency: 'BRL', locale: 'pt-BR' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_subscription_plans');
      await handler({ currency: 'BRL', locale: 'pt-BR' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/subscriptions/plans');
      expect(url).toContain('currency=BRL');
      expect(url).toContain('locale=pt-BR');
    });
  });

  describe('error handling', () => {
    it('handles API errors for list_subscription_plans', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({ message: 'Not found' }),
      });

      const handler = getToolHandler(server, 'list_subscription_plans');
      const result = await handler({}) as { content: Array<{ type: string; text: string }> };

      expect(result.content[0].text).toContain('Error 404');
    });
  });
});
