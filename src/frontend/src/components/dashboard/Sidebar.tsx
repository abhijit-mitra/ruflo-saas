import { useState } from 'react';
import { clsx } from 'clsx';
import {
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: HomeIcon, href: '/dashboard' },
  { name: 'Members', icon: UsersIcon, href: '/dashboard/members' },
  { name: 'Settings', icon: Cog6ToothIcon, href: '/dashboard/settings' },
  { name: 'Billing', icon: CreditCardIcon, href: '/dashboard/billing' },
];

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (href: string) => void;
}

export default function Sidebar({ activeItem = '/dashboard', onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        'flex flex-col bg-[#0f0f0f] border-r border-border/30 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/30">
        {!collapsed && (
          <span className="text-xl font-bold text-primary">RuFlo</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = activeItem === item.href;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => onNavigate?.(item.href)}
              className={clsx(
                'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                collapsed && 'justify-center px-2',
              )}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-border/30 p-4">
          <p className="text-xs text-text-muted">RuFlo v0.1.0</p>
        </div>
      )}
    </aside>
  );
}
