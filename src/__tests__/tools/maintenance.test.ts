import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listMaintenance, getMaintenance } from '../../tools/maintenance.js';
import type { GetMonitorClient } from '../../client/api-client.js';

function makeClient(): GetMonitorClient {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as GetMonitorClient;
}

describe('maintenance tools', () => {
  let client: GetMonitorClient;
  beforeEach(() => { client = makeClient(); });

  it('listMaintenance calls /api/v1/status-pages/{id}/maintenance', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await listMaintenance(client, 'sp1', {});
    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/status-pages/sp1/maintenance',
      expect.any(Object),
    );
    expect(result.content[0].text).toContain('No maintenance');
  });

  it('listMaintenance passes date range params', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await listMaintenance(client, 'sp1', {
      startDate: '2026-05-01T00:00:00Z',
      endDate: '2026-05-31T23:59:59Z',
    });
    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/status-pages/sp1/maintenance',
      expect.objectContaining({
        startDate: '2026-05-01T00:00:00Z',
        endDate: '2026-05-31T23:59:59Z',
      }),
    );
  });

  it('getMaintenance calls /api/v1/status-pages/{id}/maintenance/{maintenanceId}', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'm1', title: 'DB upgrade', status: 'scheduled' });
    const result = await getMaintenance(client, 'sp1', 'm1');
    expect(client.get).toHaveBeenCalledWith('/api/v1/status-pages/sp1/maintenance/m1');
    expect(result.content[0].text).toContain('DB upgrade');
  });
});
