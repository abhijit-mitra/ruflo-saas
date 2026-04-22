import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav onLogout={logout} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
