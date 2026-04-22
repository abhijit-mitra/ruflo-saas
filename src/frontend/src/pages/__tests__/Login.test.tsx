import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Login from '../Login';

// Mock LoginForm component
vi.mock('@/components/auth/LoginForm', () => ({
  default: () => <div data-testid="login-form">LoginForm</div>,
}));

describe('Login page', () => {
  it('renders LoginForm component', () => {
    render(<Login />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('renders RuFlo branding', () => {
    render(<Login />);
    expect(screen.getByText('RuFlo')).toBeInTheDocument();
  });

  it('has dark gradient background', () => {
    const { container } = render(<Login />);
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv).toBeInTheDocument();
    // The page wraps content in a min-h-screen container
    expect(outerDiv.className).toContain('min-h-screen');
    // The gradient is applied via an inner absolute div with inline style
    const absoluteDiv = outerDiv.querySelector('.absolute.inset-0');
    expect(absoluteDiv).toBeInTheDocument();
  });
});
