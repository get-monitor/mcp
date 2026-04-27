import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listIncidents, getIncident } from '../../tools/incidents.js';
import type { GetMonitorClient } from '../../client/api-client.js';

function makeClient(): GetMonitorClient {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as GetMonitorClient;
}

describe('incident tools', () => {
  let client: GetMonitorClient;
  beforeEach(() => { client = makeClient(); });

  it('listIncidents calls correct endpoint with status filter', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    await listIncidents(client, 'sp1', { status: 'investigating' });
    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/status-pages/sp1/incidents',
      expect.objectContaining({ status: 'investigating' }),
    );
  });

  it('listIncidents returns empty message when no incidents', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    const result = await listIncidents(client, 'sp1', {});
    expect(result.content[0].text).toContain('No incidents');
  });

  it('getIncident calls /api/v1/status-pages/{id}/incidents/{incidentId}', async () => {
    (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'inc1', title: 'DB down', status: 'resolved' });
    const result = await getIncident(client, 'sp1', 'inc1');
    expect(client.get).toHaveBeenCalledWith('/api/v1/status-pages/sp1/incidents/inc1');
    expect(result.content[0].text).toContain('DB down');
  });
});
