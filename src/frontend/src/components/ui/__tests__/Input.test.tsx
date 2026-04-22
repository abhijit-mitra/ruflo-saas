import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import Input from '../Input';

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  EyeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="eye-icon" {...props} />,
  EyeSlashIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="eye-slash-icon" {...props} />,
}));

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message when error prop provided', () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  it('toggles password visibility', () => {
    render(<Input label="Password" type="password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    // Click show password button
    const toggleButton = screen.getByLabelText('Show password');
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    // Click hide password button
    const hideButton = screen.getByLabelText('Hide password');
    fireEvent.click(hideButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('forwards ref and other props', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} label="Name" placeholder="Enter name" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('applies error styling when error present', () => {
    render(<Input label="Email" error="Invalid" />);
    const input = screen.getByLabelText('Email');
    expect(input.className).toContain('border-red-500');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows helper text when no error', () => {
    render(<Input label="Email" helperText="We will never share your email" />);
    expect(screen.getByText('We will never share your email')).toBeInTheDocument();
  });

  it('hides helper text when error is present', () => {
    render(<Input label="Email" helperText="Helper" error="Error message" />);
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
