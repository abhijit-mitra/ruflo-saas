import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  HomeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="home-icon" {...props} />,
  UsersIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="users-icon" {...props} />,
  Cog6ToothIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="cog-icon" {...props} />,
  CreditCardIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="credit-icon" {...props} />,
  ChevronLeftIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="chevron-left" {...props} />,
  ChevronRightIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="chevron-right" {...props} />,
}));

describe('Sidebar', () => {
  it('renders navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('highlights the active item', () => {
    render(<Sidebar activeItem="/dashboard/members" />);
    const membersButton = screen.getByText('Members').closest('button');
    expect(membersButton).toHaveAttribute('aria-current', 'page');

    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).not.toHaveAttribute('aria-current');
  });

  it('highlights Dashboard by default', () => {
    render(<Sidebar />);
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).toHaveAttribute('aria-current', 'page');
  });

  it('toggles collapse state', () => {
    render(<Sidebar />);

    // Initially expanded - should show nav text
    expect(screen.getByText('Dashboard')).toBeVisible();
    expect(screen.getByText('RuFlo')).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(collapseButton);

    // After collapse - nav text should be hidden
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('RuFlo')).not.toBeInTheDocument();

    // Click expand button
    const expandButton = screen.getByLabelText('Expand sidebar');
    fireEvent.click(expandButton);

    // After expand - nav text should be visible again
    expect(screen.getByText('Dashboard')).toBeVisible();
  });

  it('calls onNavigate when a nav item is clicked', () => {
    const handleNavigate = vi.fn();
    render(<Sidebar onNavigate={handleNavigate} />);

    fireEvent.click(screen.getByText('Members'));
    expect(handleNavigate).toHaveBeenCalledWith('/dashboard/members');
  });
});
