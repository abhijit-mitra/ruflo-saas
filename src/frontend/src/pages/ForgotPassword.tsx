import ForgotPasswordForm from '@/components/auth/ForgotPassword';

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 50%, rgba(229, 9, 20, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 30% 70%, rgba(26, 26, 46, 0.6) 0%, transparent 50%),
            linear-gradient(180deg, #0f0f0f 0%, #141414 50%, #0f0f0f 100%)
          `,
        }}
      />
      {/* Content */}
      <div className="relative z-10 w-full px-4">
        <div className="flex flex-col items-center">
          <h2 className="mb-8 text-4xl font-bold text-primary tracking-tight">
            RuFlo
          </h2>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
