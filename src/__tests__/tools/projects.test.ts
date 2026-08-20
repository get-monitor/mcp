import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerProjectTools } from '../../tools/projects.js';

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

describe('Project Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerProjectTools(server, client);
  });

  describe('list_projects', () => {
    it('calls GET /api/v1/projects', async () => {
      const responseData = [{ id: 'proj-1' }, { id: 'proj-2' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_projects');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_project', () => {
    it('calls POST /api/v1/projects with data', async () => {
      const responseData = { id: 'proj-1', name: 'My Project' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_project');
      const result = await handler({ name: 'My Project' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ name: 'My Project' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_project', () => {
    it('calls GET /api/v1/projects/{projectId}', async () => {
      const responseData = { id: 'proj-1', name: 'My Project' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_project');
      const result = await handler({ projectId: 'proj-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects/proj-1');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_project', () => {
    it('calls PATCH /api/v1/projects/{projectId} with data', async () => {
      const responseData = { id: 'proj-1', name: 'Updated Project' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_project');
      const result = await handler({ projectId: 'proj-1', name: 'Updated Project' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects/proj-1');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ name: 'Updated Project' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_project', () => {
    it('calls DELETE /api/v1/projects/{projectId}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'delete_project');
      const result = await handler({ projectId: 'proj-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects/proj-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('rotate_project_ingestion_key', () => {
    it('calls POST /api/v1/projects/{projectId}/ingestion-key/rotate with empty body', async () => {
      const responseData = { id: 'proj-1', ingestionKey: 'new-key' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'rotate_project_ingestion_key');
      const result = await handler({ projectId: 'proj-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects/proj-1/ingestion-key/rotate');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({});
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('list_source_map_tokens', () => {
    it('calls GET /api/v1/projects/{projectId}/source-map-tokens', async () => {
      const responseData = [{ id: 'smt-1' }, { id: 'smt-2' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_source_map_tokens');
      const result = await handler({ projectId: 'proj-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects/proj-1/source-map-tokens');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_source_map_token', () => {
    it('calls POST /api/v1/projects/{projectId}/source-map-tokens', async () => {
      const responseData = { id: 'smt-1', name: 'CI token' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_source_map_token');
      const result = await handler({ projectId: 'proj-1', name: 'CI token' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects/proj-1/source-map-tokens');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ name: 'CI token' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('revoke_source_map_token', () => {
    it('calls DELETE /api/v1/projects/{projectId}/source-map-tokens/{tokenId}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'revoke_source_map_token');
      const result = await handler({ projectId: 'proj-1', tokenId: 'smt-1' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/projects/proj-1/source-map-tokens/smt-1');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('error handling', () => {
    it('returns error text on API error instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404, headers: new Map(), json: async () => ({ message: 'Not found' }) });
      const handler = getToolHandler(server, 'get_project');
      const result = await handler({ projectId: 'proj_404' }) as { content: Array<{ type: string; text: string }> };
      expect(result.content[0].text).toContain('Error 404');
    });
  });
});
