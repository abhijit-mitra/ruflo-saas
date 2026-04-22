import { getGoogleAuthUrl, getMicrosoftAuthUrl } from '@/services/auth';

export default function OAuthButtons() {
  const handleGoogle = () => {
    window.location.href = getGoogleAuthUrl();
  };

  const handleMicrosoft = () => {
    window.location.href = getMicrosoftAuthUrl();
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogle}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Sign in with Google"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <button
        type="button"
        onClick={handleMicrosoft}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-[#2F2F2F] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3b3b3b] focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Sign in with Microsoft"
      >
        <svg className="h-5 w-5" viewBox="0 0 21 21" aria-hidden="true">
          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
        Continue with Microsoft
      </button>
    </div>
  );
}
