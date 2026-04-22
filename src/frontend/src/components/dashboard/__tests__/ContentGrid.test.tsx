import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentGrid from '../ContentGrid';

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  ChevronLeftIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="chevron-left" {...props} />,
  ChevronRightIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="chevron-right" {...props} />,
}));

// Mock Card component
vi.mock('@/components/ui/Card', () => ({
  default: ({ children, hoverable, className, ...props }: {
    children: React.ReactNode;
    hoverable?: boolean;
    className?: string;
    padding?: string;
  }) => (
    <div
      data-testid="card"
      data-hoverable={hoverable}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
}));

const mockRows = [
  {
    title: 'Active Workflows',
    items: [
      { id: '1', title: 'CI/CD Pipeline', subtitle: 'Production deploy', metric: '98.2%', color: '#22c55e' },
      { id: '2', title: 'Data Processing', subtitle: 'ETL batch job', metric: '4.2k/s', color: '#3b82f6' },
    ],
  },
  {
    title: 'Recent Deployments',
    items: [
      { id: '3', title: 'v2.4.1 Release', subtitle: 'Deployed 2 hours ago', metric: 'Live', color: '#22c55e' },
    ],
  },
];

describe('ContentGrid', () => {
  it('renders section titles', () => {
    render(<ContentGrid rows={mockRows} />);
    expect(screen.getByText('Active Workflows')).toBeInTheDocument();
    expect(screen.getByText('Recent Deployments')).toBeInTheDocument();
  });

  it('renders cards within sections', () => {
    render(<ContentGrid rows={mockRows} />);
    expect(screen.getByText('CI/CD Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Data Processing')).toBeInTheDocument();
    expect(screen.getByText('v2.4.1 Release')).toBeInTheDocument();
  });

  it('renders card subtitles and metrics', () => {
    render(<ContentGrid rows={mockRows} />);
    expect(screen.getByText('Production deploy')).toBeInTheDocument();
    expect(screen.getByText('98.2%')).toBeInTheDocument();
    expect(screen.getByText('ETL batch job')).toBeInTheDocument();
    expect(screen.getByText('4.2k/s')).toBeInTheDocument();
  });

  it('cards have hoverable prop set', () => {
    render(<ContentGrid rows={mockRows} />);
    const cards = screen.getAllByTestId('card');
    cards.forEach((card) => {
      expect(card).toHaveAttribute('data-hoverable', 'true');
    });
  });

  it('renders scroll buttons for each section', () => {
    render(<ContentGrid rows={mockRows} />);
    expect(screen.getByLabelText('Scroll Active Workflows left')).toBeInTheDocument();
    expect(screen.getByLabelText('Scroll Active Workflows right')).toBeInTheDocument();
    expect(screen.getByLabelText('Scroll Recent Deployments left')).toBeInTheDocument();
    expect(screen.getByLabelText('Scroll Recent Deployments right')).toBeInTheDocument();
  });
});
