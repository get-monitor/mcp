import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveStatusPage,
  getStatusPageStatus,
  getStatusPageComponents,
  listStatusUpdates,
} from '../../tools/status-pages.js';
import type { GetMonitorClient } from '../../client/api-client.js';

function makeClient(): GetMonitorClient {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as GetMonitorClient;
}

describe('status page tools', () => {
  let client: GetMonitorClient;
  beforeEach(() => { client = makeClient(); });

  it('resolveStatusPage calls GET /api/v1/status-pages with slug param', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'sp1', name: 'My Page', domain: 'mypage.statuspage.one' });
    const result = await resolveStatusPage(client, { slug: 'mypage' });
    expect(client.get).toHaveBeenCalledWith('/api/v1/status-pages', expect.objectContaining({ slug: 'mypage' }));
    expect(result.content[0].text).toContain('My Page');
  });

  it('resolveStatusPage calls GET /api/v1/status-pages with domain param', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'sp1', name: 'My Page', domain: 'status.myapp.com' });
    await resolveStatusPage(client, { domain: 'status.myapp.com' });
    expect(client.get).toHaveBeenCalledWith('/api/v1/status-pages', expect.objectContaining({ domain: 'status.myapp.com' }));
  });

  it('getStatusPageStatus returns formatted status', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'operational' });
    const result = await getStatusPageStatus(client, 'sp1');
    expect(client.get).toHaveBeenCalledWith('/api/v1/status-pages/sp1/status');
    expect(result.content[0].text).toContain('operational');
  });

  it('getStatusPageComponents passes days param when provided', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ components: [] });
    await getStatusPageComponents(client, 'sp1', 30);
    expect(client.get).toHaveBeenCalledWith('/api/v1/status-pages/sp1/components', { days: '30' });
  });

  it('listStatusUpdates calls updates endpoint with pagination', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    await listStatusUpdates(client, 'sp1', { page: 2, limit: 10 });
    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/status-pages/sp1/updates',
      expect.objectContaining({ page: '2', limit: '10' }),
    );
  });
});
