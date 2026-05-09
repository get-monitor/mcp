import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerOrganizationTools } from '../../tools/organizations.js';

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

describe('Organization Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerOrganizationTools(server, client);
  });

  describe('check_organization_slug', () => {
    it('calls GET /api/v1/organizations/check-slug with slug query param', async () => {
      const responseData = { available: true };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'check_organization_slug');
      const result = await handler({ slug: 'my-org' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/organizations/check-slug');
      expect(url).toContain('slug=my-org');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_organization', () => {
    it('calls POST /api/v1/organizations with required fields', async () => {
      const responseData = { id: 'org-1', name: 'My Org', slug: 'my-org' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_organization');
      const result = await handler({ name: 'My Org', slug: 'my-org' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toMatchObject({ name: 'My Org', slug: 'my-org' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls POST /api/v1/organizations with all optional fields', async () => {
      const responseData = { id: 'org-1', name: 'My Org', slug: 'my-org' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_organization');
      await handler({ name: 'My Org', slug: 'my-org', logo: 'https://logo.url', email: 'org@example.com', phoneNumber: '+1234567890' });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({ name: 'My Org', slug: 'my-org', logo: 'https://logo.url', email: 'org@example.com', phoneNumber: '+1234567890' });
    });
  });

  describe('list_organizations', () => {
    it('calls GET /api/v1/organizations', async () => {
      const responseData = [{ id: 'org-1' }, { id: 'org-2' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_organizations');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_guest_access_organizations', () => {
    it('calls GET /api/v1/organizations/guest-access', async () => {
      const responseData = [{ id: 'org-3' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_guest_access_organizations');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/guest-access');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_user_organization_roles', () => {
    it('calls GET /api/v1/organizations/roles', async () => {
      const responseData = [{ orgId: 'org-1', role: 'admin' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_user_organization_roles');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/roles');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_organization_members', () => {
    it('calls GET /api/v1/organizations/{orgId}/members', async () => {
      const responseData = [{ userId: 'user-1', role: 'member' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_organization_members');
      const result = await handler({ orgId: 'org-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc/members');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_organization_invitations', () => {
    it('calls GET /api/v1/organizations/{orgId}/invitations', async () => {
      const responseData = [{ id: 'inv-1', email: 'user@example.com' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_organization_invitations');
      const result = await handler({ orgId: 'org-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc/invitations');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_organization', () => {
    it('calls GET /api/v1/organizations/{orgId}', async () => {
      const responseData = { id: 'org-abc', name: 'My Org' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_organization');
      const result = await handler({ orgId: 'org-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_organization', () => {
    it('calls PATCH /api/v1/organizations/{orgId} with provided fields', async () => {
      const responseData = { id: 'org-abc', name: 'Updated Org' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_organization');
      const result = await handler({ orgId: 'org-abc', name: 'Updated Org' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toMatchObject({ name: 'Updated Org' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_organization_language', () => {
    it('calls PATCH /api/v1/organizations/{orgId}/language with language', async () => {
      const responseData = { id: 'org-abc', language: 'pt-BR' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_organization_language');
      const result = await handler({ orgId: 'org-abc', language: 'pt-BR' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc/language');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ language: 'pt-BR' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_organization_status', () => {
    it('calls GET /api/v1/organizations/{orgId}/status', async () => {
      const responseData = { status: 'operational' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_organization_status');
      const result = await handler({ orgId: 'org-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc/status');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('invite_organization_member', () => {
    it('calls POST /api/v1/organizations/{orgId}/members/invite', async () => {
      const responseData = { id: 'inv-1', email: 'newuser@example.com', role: 'member' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'invite_organization_member');
      const result = await handler({ orgId: 'org-abc', email: 'newuser@example.com', role: 'member' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc/members/invite');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ email: 'newuser@example.com', role: 'member' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('remove_organization_member', () => {
    it('calls DELETE /api/v1/organizations/{orgId}/members/{userId}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'remove_organization_member');
      const result = await handler({ orgId: 'org-abc', userId: 'user-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc/members/user-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('update_organization_member_role', () => {
    it('calls PATCH /api/v1/organizations/{orgId}/members/{userId}/role', async () => {
      const responseData = { userId: 'user-1', role: 'page_guest' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_organization_member_role');
      const result = await handler({ orgId: 'org-abc', userId: 'user-1', role: 'page_guest' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc/members/user-1/role');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ role: 'page_guest' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_organization_subscription', () => {
    it('calls GET /api/v1/organizations/{organizationId}/subscription', async () => {
      const responseData = { plan: 'pro', status: 'active' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_organization_subscription');
      const result = await handler({ organizationId: 'org-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc/subscription');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_organization_usage', () => {
    it('calls GET /api/v1/organizations/{organizationId}/subscription/usage', async () => {
      const responseData = { monitorsUsed: 5, monitorsLimit: 10 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_organization_usage');
      const result = await handler({ organizationId: 'org-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/organizations/org-abc/subscription/usage');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_invitation', () => {
    it('calls GET /api/v1/invitations/{invitationId}', async () => {
      const responseData = { id: 'inv-1', email: 'user@example.com', status: 'pending' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_invitation');
      const result = await handler({ invitationId: 'inv-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/invitations/inv-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('accept_invitation', () => {
    it('calls POST /api/v1/invitations/{invitationId}/accept', async () => {
      const responseData = { id: 'inv-1', status: 'accepted' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'accept_invitation');
      const result = await handler({ invitationId: 'inv-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/invitations/inv-1/accept');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('error handling', () => {
    it('returns error text on API error instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Map(),
        json: async () => ({ message: 'Forbidden' }),
      });

      const handler = getToolHandler(server, 'get_organization');
      const result = await handler({ orgId: 'org-abc' });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error 403: {"message":"Forbidden"}' }],
      });
    });
  });
});
