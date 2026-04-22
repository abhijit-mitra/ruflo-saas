import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OAuthButtons from './OAuthButtons';
import { useAuth } from '@/hooks/useAuth';
import type { ApiError } from '@/types';

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      await login({ email, password });
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiError = err.response?.data as ApiError | undefined;
        setError(apiError?.message || 'Invalid email or password.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="rounded-lg bg-black/75 p-10 backdrop-blur-sm">
        <h1 className="mb-7 text-3xl font-bold text-text-primary">Sign In</h1>

        {error && (
          <div
            className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-text-muted">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <OAuthButtons />

        <div className="mt-6 space-y-3 text-center text-sm">
          <Link
            to="/forgot-password"
            className="block text-text-secondary hover:text-text-primary transition-colors"
          >
            Forgot your password?
          </Link>
          <p className="text-text-muted">
            New to RuFlo?{' '}
            <Link
              to="/signup"
              className="text-text-primary hover:underline font-medium"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
