import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetMonitorClient } from '../../client/api-client.js';
import { registerNotebookTools } from '../../tools/notebooks.js';

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

describe('Notebook Tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: GetMonitorClient;
  let server: McpServer;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new GetMonitorClient({ baseUrl: 'https://api.example.com', token: 'test-token' });
    server = new McpServer({ name: 'test', version: '0.0.0' });
    registerNotebookTools(server, client);
  });

  describe('list_notebooks', () => {
    it('calls GET /api/v1/notebooks without params', async () => {
      const responseData = [{ id: 'nb-1' }, { id: 'nb-2' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_notebooks');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/notebooks');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls GET /api/v1/notebooks with search, page, limit', async () => {
      const responseData = [{ id: 'nb-1' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_notebooks');
      const result = await handler({ search: 'postmortem', page: '2', limit: '10' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/notebooks');
      expect(url).toContain('search=postmortem');
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('create_notebook', () => {
    it('calls POST /api/v1/notebooks with a title', async () => {
      const responseData = { id: 'nb-1', title: 'Postmortem' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_notebook');
      const result = await handler({ title: 'Postmortem' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/notebooks');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ title: 'Postmortem' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });

    it('calls POST /api/v1/notebooks with a templateKey', async () => {
      const responseData = { id: 'nb-2', title: 'Incident Review' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'create_notebook');
      const result = await handler({ templateKey: 'incident-review' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/notebooks');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ templateKey: 'incident-review' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('ai_draft_notebook', () => {
    it('calls POST /api/v1/notebooks/ai-draft with a prompt', async () => {
      const responseData = { id: 'nb-3', title: 'AI Drafted Notebook' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData, 201));

      const handler = getToolHandler(server, 'ai_draft_notebook');
      const result = await handler({ prompt: 'Draft a postmortem for the outage on 2026-08-01' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/notebooks/ai-draft');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ prompt: 'Draft a postmortem for the outage on 2026-08-01' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('get_notebook', () => {
    it('calls GET /api/v1/notebooks/{id}', async () => {
      const responseData = { id: 'nb-abc', title: 'My Notebook' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'get_notebook');
      const result = await handler({ id: 'nb-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/notebooks/nb-abc');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('update_notebook', () => {
    it('calls PATCH /api/v1/notebooks/{id} with title and content', async () => {
      const responseData = { id: 'nb-abc', title: 'Updated Notebook' };
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'update_notebook');
      const result = await handler({ id: 'nb-abc', title: 'Updated Notebook', content: 'New content' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/notebooks/nb-abc');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ title: 'Updated Notebook', content: 'New content' });
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('delete_notebook', () => {
    it('calls DELETE /api/v1/notebooks/{id}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map([['content-length', '0']]),
        json: async () => null,
      });

      const handler = getToolHandler(server, 'delete_notebook');
      const result = await handler({ id: 'nb-abc' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/notebooks/nb-abc');
      expect(options.method).toBe('DELETE');
      expect(result).toEqual({ content: [{ type: 'text', text: '' }] });
    });
  });

  describe('list_notebook_templates', () => {
    it('calls GET /api/v1/notebooks/templates', async () => {
      const responseData = [{ key: 'incident-review', title: 'Incident Review' }];
      mockFetch.mockResolvedValueOnce(mockResponse(responseData));

      const handler = getToolHandler(server, 'list_notebook_templates');
      const result = await handler({});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/api/v1/notebooks/templates');
      expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }] });
    });
  });

  describe('error handling', () => {
    it('returns error text on API error instead of throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Map(),
        json: async () => ({ message: 'Not found' }),
      });
      const handler = getToolHandler(server, 'get_notebook');
      const result = await handler({ id: 'nb_404' }) as { content: Array<{ type: string; text: string }> };
      expect(result.content[0].text).toContain('Error 404');
    });
  });
});
