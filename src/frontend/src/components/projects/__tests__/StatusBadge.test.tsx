import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders correct color for draft status (gray)', () => {
    render(<StatusBadge status="draft" />);
    const badge = screen.getByText('draft');
    expect(badge.className).toContain('gray');
  });

  it('renders correct color for active status (blue)', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText('active');
    expect(badge.className).toContain('blue');
  });

  it('renders correct color for won status (green)', () => {
    render(<StatusBadge status="won" />);
    const badge = screen.getByText('won');
    expect(badge.className).toContain('green');
  });

  it('renders correct color for lost status (red)', () => {
    render(<StatusBadge status="lost" />);
    const badge = screen.getByText('lost');
    expect(badge.className).toContain('red');
  });

  it('displays status text', () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('applies badge base classes', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText('active');
    expect(badge.className).toContain('rounded');
  });
});
