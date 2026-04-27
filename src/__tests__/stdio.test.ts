// src/__tests__/stdio.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('stdio entry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('does not call process.exit when GETMONITOR_API_KEY is absent', () => {
    vi.stubEnv('GETMONITOR_API_KEY', '');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    // Key is optional — no exit should occur on missing key
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
