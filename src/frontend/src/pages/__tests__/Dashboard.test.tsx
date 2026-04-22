import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';

// Mock DashboardLayout
vi.mock('@/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

// Mock ContentGrid
vi.mock('@/components/dashboard/ContentGrid', () => ({
  default: ({ rows }: { rows: Array<{ title: string; items: unknown[] }> }) => (
    <div data-testid="content-grid">
      {rows.map((row) => (
        <div key={row.title} data-testid={`section-${row.title}`}>
          {row.title}
        </div>
      ))}
    </div>
  ),
}));

describe('Dashboard page', () => {
  it('renders DashboardLayout', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  it('renders page title and description', () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText('Overview of your workflows, deployments, and infrastructure.'),
    ).toBeInTheDocument();
  });

  it('renders ContentGrid with sections', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('content-grid')).toBeInTheDocument();
    expect(screen.getByText('Active Workflows')).toBeInTheDocument();
    expect(screen.getByText('Recent Deployments')).toBeInTheDocument();
    expect(screen.getByText('Team Activity')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure Health')).toBeInTheDocument();
  });
});
