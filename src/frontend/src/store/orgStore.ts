import { create } from 'zustand';
import type { Organization, OrgMembership } from '@/types';

interface OrgState {
  currentOrg: Organization | null;
  orgs: Organization[];
  members: OrgMembership[];
  setCurrentOrg: (org: Organization) => void;
  setOrgs: (orgs: Organization[]) => void;
  setMembers: (members: OrgMembership[]) => void;
  clearOrg: () => void;
}

export const useOrgStore = create<OrgState>()((set) => ({
  currentOrg: null,
  orgs: [],
  members: [],

  setCurrentOrg: (org: Organization) =>
    set({ currentOrg: org }),

  setOrgs: (orgs: Organization[]) =>
    set({ orgs }),

  setMembers: (members: OrgMembership[]) =>
    set({ members }),

  clearOrg: () =>
    set({
      currentOrg: null,
      orgs: [],
      members: [],
    }),
}));
