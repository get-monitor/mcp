import { describe, it, expect } from 'vitest';
import { pickOrganizationId } from '../http.js';

const ORGS = [
  { id: 'org-test' },   // first — an empty scratch org for this user
  { id: 'org-real' },   // the one the user is actually looking at
];

describe('pickOrganizationId', () => {
  it('uses the requested organization when the user belongs to it', () => {
    // The regression: without this the session bound to org-test and every
    // tool returned [] for a user whose data lives in org-real.
    expect(pickOrganizationId(ORGS, 'org-real')).toBe('org-real');
  });

  it('falls back to the first organization when none is requested', () => {
    expect(pickOrganizationId(ORGS, undefined)).toBe('org-test');
  });

  it('ignores an organization the user is not a member of', () => {
    // The header is client-supplied, so membership decides — never the caller.
    expect(pickOrganizationId(ORGS, 'org-someone-else')).toBe('org-test');
  });

  it('ignores an empty or blank requested organization', () => {
    expect(pickOrganizationId(ORGS, '')).toBe('org-test');
    expect(pickOrganizationId(ORGS, '   ')).toBe('org-test');
  });

  it('returns undefined when the user has no organizations', () => {
    expect(pickOrganizationId([], 'org-real')).toBeUndefined();
    expect(pickOrganizationId([], undefined)).toBeUndefined();
  });
});
