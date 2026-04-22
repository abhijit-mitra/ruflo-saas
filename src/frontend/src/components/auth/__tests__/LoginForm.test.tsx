import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockUseAuth = vi.fn(() => ({
  login: mockLogin,
  isLoading: false,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  EyeIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="eye-icon" {...props} />,
  EyeSlashIcon: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="eye-slash-icon" {...props} />,
}));

// Mock OAuthButtons
vi.mock('../OAuthButtons', () => ({
  default: () => (
    <div data-testid="oauth-buttons">
      <button>Continue with Google</button>
      <button>Continue with Microsoft</button>
    </div>
  ),
}));

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });
  });

  it('renders email and password inputs', () => {
    renderLoginForm();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders "Sign In" button', () => {
    renderLoginForm();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders Google and Microsoft OAuth buttons', () => {
    renderLoginForm();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
  });

  it('renders link to signup page', () => {
    renderLoginForm();
    const signupLink = screen.getByText('Sign up now');
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('renders link to forgot password', () => {
    renderLoginForm();
    const forgotLink = screen.getByText('Forgot your password?');
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink.closest('a') ?? forgotLink).toHaveAttribute('href', '/forgot-password');
  });

  it('shows validation error for empty fields on submit', async () => {
    renderLoginForm();
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please fill in all fields.');
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login function with email/password on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLoginForm();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@company.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@company.com',
        password: 'password123',
      });
    });
  });

  it('shows loading state during submission', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: true,
    });
    renderLoginForm();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
  });
});
