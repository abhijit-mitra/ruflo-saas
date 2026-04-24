import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Projects from '../Projects';
import type { Project } from '@/types/domain';

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Office Renovation',
    status: 'active',
    estimatedValue: 150000,
    quoteCount: 3,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'Warehouse Build',
    status: 'draft',
    estimatedValue: 500000,
    quoteCount: 0,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-15T00:00:00Z',
  },
];

// Mock DashboardLayout
vi.mock('@/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

// Mock the project store
const mockSetProjects = vi.fn();
const mockSetLoading = vi.fn();
vi.mock('@/store/projectStore', () => ({
  useProjectStore: () => ({
    projects: mockProjects,
    isLoading: false,
    setProjects: mockSetProjects,
    setLoading: mockSetLoading,
  }),
}));

// Mock the projects API
vi.mock('@/services/projects', () => ({
  getProjects: vi.fn().mockResolvedValue([]),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderProjects() {
  return render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>,
  );
}

describe('Projects page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project list', () => {
    renderProjects();
    expect(screen.getByText('Office Renovation')).toBeInTheDocument();
    expect(screen.getByText('Warehouse Build')).toBeInTheDocument();
  });

  it('shows "New Project" button', () => {
    renderProjects();
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('shows status filter buttons', () => {
    renderProjects();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
