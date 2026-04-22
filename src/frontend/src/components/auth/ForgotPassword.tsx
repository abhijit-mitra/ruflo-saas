import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { forgotPassword } from '@/services/auth';
import type { ApiError } from '@/types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword({ email });
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof AxiosError) {
        const apiError = err.response?.data as ApiError | undefined;
        setError(apiError?.message || 'Failed to send reset link. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="rounded-lg bg-black/75 p-10 backdrop-blur-sm">
        {isSuccess ? (
          <div className="text-center space-y-4">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold text-text-primary">Check Your Email</h1>
            <p className="text-text-secondary text-sm">
              If an account exists for <span className="text-text-primary">{email}</span>,
              you will receive a password reset link shortly.
            </p>
            <Link
              to="/login"
              className="inline-block mt-4 text-sm text-primary hover:text-primary-hover transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-3xl font-bold text-text-primary">Reset Password</h1>
            <p className="mb-7 text-text-secondary text-sm">
              Enter your email and we will send you a reset link.
            </p>

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
              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-text-muted">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
