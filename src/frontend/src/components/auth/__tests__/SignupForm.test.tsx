import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignupForm from '../SignupForm';

const mockSignup = vi.fn();
const mockUseAuth = vi.fn(() => ({
  signup: mockSignup,
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
  default: () => <div data-testid="oauth-buttons" />,
}));

function renderSignupForm() {
  return render(
    <MemoryRouter>
      <SignupForm />
    </MemoryRouter>,
  );
}

function fillForm(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    'Full Name': 'Jane Smith',
    'Company Name': 'Acme Inc.',
    'Company Email': 'jane@acme.com',
    Password: 'password123',
    'Confirm Password': 'password123',
    ...overrides,
  };
  Object.entries(values).forEach(([label, value]) => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  });
}

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signup: mockSignup,
      isLoading: false,
    });
  });

  it('renders all fields', () => {
    renderSignupForm();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Company Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('rejects personal email domains (gmail)', async () => {
    renderSignupForm();
    fillForm({ 'Company Email': 'test@gmail.com' });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Please use your company email address.')).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('rejects personal email domains (yahoo)', async () => {
    renderSignupForm();
    fillForm({ 'Company Email': 'test@yahoo.com' });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Please use your company email address.')).toBeInTheDocument();
    });
  });

  it('rejects personal email domains (hotmail)', async () => {
    renderSignupForm();
    fillForm({ 'Company Email': 'test@hotmail.com' });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Please use your company email address.')).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    renderSignupForm();
    fillForm({ 'Confirm Password': 'differentpassword' });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('calls signup with correct data on valid submit', async () => {
    mockSignup.mockResolvedValueOnce(undefined);
    renderSignupForm();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane@acme.com',
        password: 'password123',
        companyName: 'Acme Inc.',
      });
    });
  });
});
