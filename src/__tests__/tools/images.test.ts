import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerImageTools } from '../../tools/images.js';

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

describe('Image Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerImageTools(server, client);
  });

  describe('record_image_upload', () => {
    it('calls POST /api/v1/images/record with all required fields', async () => {
      const responseData = { id: 'img-1', url: 'https://example.com/image.jpg' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'record_image_upload');
      const result = await handler({
        url: 'https://example.com/image.jpg',
        filename: 'image.jpg',
        size: 1024,
        type: 'profile',
        entityId: 'user-1',
        entityType: 'user',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/images/record');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        url: 'https://example.com/image.jpg',
        filename: 'image.jpg',
        size: 1024,
        type: 'profile',
        entityId: 'user-1',
        entityType: 'user',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('supports logo type and organization entity', async () => {
      const responseData = { id: 'img-2' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'record_image_upload');
      await handler({
        url: 'https://example.com/logo.png',
        filename: 'logo.png',
        size: 2048,
        type: 'logo',
        entityId: 'org-1',
        entityType: 'organization',
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        type: 'logo',
        entityType: 'organization',
      });
    });
  });

  describe('delete_image', () => {
    it('calls DELETE /api/v1/images with body parameters', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(null, 204));

      const handler = getToolHandler(server, 'delete_image');
      const result = await handler({
        url: 'https://example.com/image.jpg',
        entityType: 'user',
        entityId: 'user-1',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/images');
      expect(options.method).toBe('DELETE');
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        url: 'https://example.com/image.jpg',
        entityType: 'user',
        entityId: 'user-1',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('replace_image', () => {
    it('calls PUT /api/v1/images/replace with new and optional old URL', async () => {
      const responseData = { id: 'img-3', url: 'https://example.com/new-image.jpg' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'replace_image');
      const result = await handler({
        oldUrl: 'https://example.com/old-image.jpg',
        newUrl: 'https://example.com/new-image.jpg',
        entityType: 'organization',
        entityId: 'org-1',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/images/replace');
      expect(options.method).toBe('PUT');
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        oldUrl: 'https://example.com/old-image.jpg',
        newUrl: 'https://example.com/new-image.jpg',
        entityType: 'organization',
        entityId: 'org-1',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('supports replacing without oldUrl', async () => {
      const responseData = { id: 'img-4' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'replace_image');
      await handler({
        newUrl: 'https://example.com/new-image.jpg',
        entityType: 'status_page',
        entityId: 'sp-1',
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        newUrl: 'https://example.com/new-image.jpg',
        entityType: 'status_page',
        entityId: 'sp-1',
      });
      expect(body.oldUrl).toBeUndefined();
    });
  });

  describe('get_image_placeholder', () => {
    it('calls GET /api/v1/images/placeholder with query parameters', async () => {
      const responseData = { url: 'https://example.com/placeholder.png' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_image_placeholder');
      const result = await handler({
        type: 'profile',
        size: 'large',
        name: 'John Doe',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/images/placeholder');
      expect(url).toContain('type=profile');
      expect(url).toContain('size=large');
      // URL encoding uses + for spaces in query strings, not %20
      expect(url).toMatch(/name=John[\+%20]Doe/);
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_image_constraints', () => {
    it('calls GET /api/v1/images/constraints with type query parameter', async () => {
      const responseData = { maxSize: 5242880, allowedFormats: ['jpg', 'png'] };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_image_constraints');
      const result = await handler({
        type: 'logo',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/images/constraints');
      expect(url).toContain('type=logo');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_entity_image', () => {
    it('calls PATCH /api/v1/images/entity with image URL', async () => {
      const responseData = { entityId: 'org-1', entityType: 'organization', imageUrl: 'https://example.com/image.jpg' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_entity_image');
      const result = await handler({
        entityType: 'organization',
        entityId: 'org-1',
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/images/entity');
      expect(options.method).toBe('PATCH');
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        entityType: 'organization',
        entityId: 'org-1',
        imageUrl: 'https://example.com/image.jpg',
      });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('supports removing image with null imageUrl', async () => {
      const responseData = { entityId: 'user-1', entityType: 'user', imageUrl: null };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_entity_image');
      await handler({
        entityType: 'user',
        entityId: 'user-1',
        imageUrl: null,
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        entityType: 'user',
        entityId: 'user-1',
        imageUrl: null,
      });
    });
  });

  describe('cleanup_image_database', () => {
    it('calls POST /api/v1/images/cleanup with empty body', async () => {
      const responseData = { removedCount: 5 };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'cleanup_image_database');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/images/cleanup');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });
});
