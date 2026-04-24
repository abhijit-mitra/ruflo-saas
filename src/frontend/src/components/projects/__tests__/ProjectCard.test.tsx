import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from '../ProjectCard';

describe('ProjectCard', () => {
  const defaultProps = {
    project: {
      id: 'proj-1',
      name: 'Office Renovation',
      status: 'active' as const,
      estimatedValue: 150000,
      quoteCount: 3,
      customerName: 'Acme Corp',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-20T00:00:00Z',
    },
    onClick: vi.fn(),
  };

  it('renders project name and status', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText('Office Renovation')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows estimated value', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText('$150,000')).toBeInTheDocument();
  });

  it('shows quote count', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText(/3\s*quotes?/i)).toBeInTheDocument();
  });

  it('has hover effect class', () => {
    const { container } = render(<ProjectCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('hover');
  });

  it('calls onClick when clicked', () => {
    const { container } = render(<ProjectCard {...defaultProps} />);
    fireEvent.click(container.firstChild as HTMLElement);
    expect(defaultProps.onClick).toHaveBeenCalled();
  });
});
