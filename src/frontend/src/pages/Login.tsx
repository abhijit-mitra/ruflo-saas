import LoginForm from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(229, 9, 20, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(26, 26, 46, 0.8) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(15, 15, 15, 0.9) 0%, transparent 50%),
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
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
