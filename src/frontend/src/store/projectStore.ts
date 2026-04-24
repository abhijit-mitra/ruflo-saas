import { create } from 'zustand';
import type { Project } from '@/types/domain';

export type ProjectTab =
  | 'quotes'
  | 'documents'
  | 'change-orders'
  | 'invoices'
  | 'purchase-orders'
  | 'sales-orders'
  | 'files'
  | 'bom';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  activeTab: ProjectTab;
  isLoading: boolean;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setActiveTab: (tab: ProjectTab) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>()((set) => ({
  projects: [],
  currentProject: null,
  activeTab: 'quotes',
  isLoading: false,

  setProjects: (projects: Project[]) => set({ projects }),
  setCurrentProject: (project: Project | null) => set({ currentProject: project }),
  setActiveTab: (tab: ProjectTab) => set({ activeTab: tab }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
