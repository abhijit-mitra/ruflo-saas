import { describe, it, expect, beforeEach } from 'vitest';
import { useOrgStore } from '../orgStore';
import type { Organization, OrgMembership, User } from '@/types';

const mockOrg: Organization = {
  id: 'org-1',
  name: 'Test Org',
  slug: 'test-org',
  plan: 'pro',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockOrg2: Organization = {
  id: 'org-2',
  name: 'Another Org',
  slug: 'another-org',
  plan: 'free',
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-02-01T00:00:00Z',
};

const mockUser: User = {
  id: 'user-1',
  email: 'test@company.com',
  name: 'Test User',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockMember: OrgMembership = {
  id: 'membership-1',
  userId: 'user-1',
  organizationId: 'org-1',
  role: 'admin',
  user: mockUser,
  organization: mockOrg,
  joinedAt: '2024-01-01T00:00:00Z',
};

describe('orgStore', () => {
  beforeEach(() => {
    useOrgStore.setState({
      currentOrg: null,
      orgs: [],
      members: [],
    });
  });

  it('has correct initial state', () => {
    const state = useOrgStore.getState();
    expect(state.currentOrg).toBeNull();
    expect(state.orgs).toEqual([]);
    expect(state.members).toEqual([]);
  });

  it('setCurrentOrg sets the current org', () => {
    useOrgStore.getState().setCurrentOrg(mockOrg);
    expect(useOrgStore.getState().currentOrg).toEqual(mockOrg);
  });

  it('setOrgs sets the orgs array', () => {
    const orgs = [mockOrg, mockOrg2];
    useOrgStore.getState().setOrgs(orgs);
    expect(useOrgStore.getState().orgs).toEqual(orgs);
    expect(useOrgStore.getState().orgs).toHaveLength(2);
  });

  it('setMembers sets the members array', () => {
    const members = [mockMember];
    useOrgStore.getState().setMembers(members);
    expect(useOrgStore.getState().members).toEqual(members);
    expect(useOrgStore.getState().members).toHaveLength(1);
  });

  it('clearOrg resets all org state', () => {
    useOrgStore.getState().setCurrentOrg(mockOrg);
    useOrgStore.getState().setOrgs([mockOrg, mockOrg2]);
    useOrgStore.getState().setMembers([mockMember]);

    useOrgStore.getState().clearOrg();

    const state = useOrgStore.getState();
    expect(state.currentOrg).toBeNull();
    expect(state.orgs).toEqual([]);
    expect(state.members).toEqual([]);
  });
});
