import { useCallback } from 'react';
import { useOrgStore } from '@/store/orgStore';
import api from '@/services/api';
import type { Organization, OrgMembership } from '@/types';

export function useOrganization() {
  const {
    currentOrg,
    orgs,
    members,
    setCurrentOrg,
    setOrgs,
    setMembers,
    clearOrg,
  } = useOrgStore();

  const fetchOrgs = useCallback(async () => {
    const response = await api.get<Organization[]>('/orgs');
    setOrgs(response.data);
    if (response.data.length > 0 && !currentOrg) {
      setCurrentOrg(response.data[0]);
    }
  }, [setOrgs, setCurrentOrg, currentOrg]);

  const fetchMembers = useCallback(async () => {
    if (!currentOrg) return;
    const response = await api.get<OrgMembership[]>(`/orgs/${currentOrg.id}/members`);
    setMembers(response.data);
  }, [currentOrg, setMembers]);

  const switchOrg = useCallback(
    (org: Organization) => {
      setCurrentOrg(org);
    },
    [setCurrentOrg],
  );

  return {
    currentOrg,
    orgs,
    members,
    fetchOrgs,
    fetchMembers,
    switchOrg,
    clearOrg,
  };
}
