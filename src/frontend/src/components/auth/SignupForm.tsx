import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OAuthButtons from './OAuthButtons';
import { useAuth } from '@/hooks/useAuth';
import type { ApiError } from '@/types';

const BLOCKED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com'];

function isCompanyEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !BLOCKED_DOMAINS.includes(domain);
}

export default function SignupForm() {
  const { signup, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!companyName.trim()) newErrors.companyName = 'Company name is required.';
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!isCompanyEmail(email)) {
      newErrors.email = 'Please use your company email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await signup({ name, email, password, companyName });
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiError = err.response?.data as ApiError | undefined;
        if (apiError?.details) {
          setErrors(
            Object.fromEntries(
              Object.entries(apiError.details).map(([key, msgs]) => [key, msgs[0]]),
            ),
          );
        } else {
          setErrors({ form: apiError?.message || 'Signup failed. Please try again.' });
        }
      } else {
        setErrors({ form: 'An unexpected error occurred.' });
      }
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="rounded-lg bg-black/75 p-10 backdrop-blur-sm">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">Get Started</h1>
        <p className="mb-7 text-text-secondary text-sm">
          Create your enterprise account
        </p>

        {errors.form && (
          <div
            className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400"
            role="alert"
          >
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Full Name"
            type="text"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
            required
          />
          <Input
            label="Company Name"
            type="text"
            placeholder="Acme Inc."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            error={errors.companyName}
            required
          />
          <Input
            label="Company Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            helperText="Personal email addresses are not accepted."
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />
          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-text-muted">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <OAuthButtons />

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
