import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listMonitors, getMonitorAggregations } from '../../tools/monitors.js';
import type { GetMonitorClient } from '../../client/api-client.js';

function makeClient(): GetMonitorClient {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as GetMonitorClient;
}

describe('monitor tools', () => {
  let client: GetMonitorClient;
  beforeEach(() => { client = makeClient(); });

  it('listMonitors calls GET /api/v1/status-pages/{id}/monitors', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'm1', name: 'API', currentStatus: 'up' },
    ]);
    const result = await listMonitors(client, 'sp1');
    expect(client.get).toHaveBeenCalledWith('/api/v1/status-pages/sp1/monitors');
    expect(result.content[0].text).toContain('API');
  });

  it('listMonitors returns empty message when no monitors', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await listMonitors(client, 'sp1');
    expect(result.content[0].text).toContain('No monitors');
  });

  it('getMonitorAggregations calls correct endpoint with date param', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ hours: [] });
    await getMonitorAggregations(client, 'sp1', 'm1', '2026-04-26');
    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/status-pages/sp1/monitors/m1/aggregations',
      { date: '2026-04-26' },
    );
  });
});
