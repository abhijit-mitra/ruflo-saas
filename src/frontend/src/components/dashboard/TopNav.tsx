import { Fragment } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';
import OrgSwitcher from './OrgSwitcher';

interface TopNavProps {
  onLogout: () => void;
}

export default function TopNav({ onLogout }: TopNavProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/30 bg-[#0f0f0f]/80 backdrop-blur-md px-6">
      {/* Left: Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-md border border-border bg-surface-card pl-9 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-colors"
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right: Org switcher, notifications, user menu */}
      <div className="flex items-center gap-3">
        <OrgSwitcher />

        <button
          className="relative rounded-md p-2 text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors"
          aria-label="View notifications"
        >
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        {/* User Menu */}
        <Menu as="div" className="relative">
          <MenuButton
            className="flex items-center gap-2 rounded-md p-1.5 hover:bg-surface-hover transition-colors"
            aria-label="User menu"
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </MenuButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-surface-card border border-border shadow-lg shadow-black/30 focus:outline-none z-50">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <MenuItem>
                  {({ focus }) => (
                    <button
                      className={clsx(
                        'flex w-full items-center gap-2 px-4 py-2 text-sm',
                        focus ? 'bg-surface-hover text-text-primary' : 'text-text-secondary',
                      )}
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      Profile
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <button
                      className={clsx(
                        'flex w-full items-center gap-2 px-4 py-2 text-sm',
                        focus ? 'bg-surface-hover text-text-primary' : 'text-text-secondary',
                      )}
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      Settings
                    </button>
                  )}
                </MenuItem>
              </div>
              <div className="border-t border-border py-1">
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={onLogout}
                      className={clsx(
                        'flex w-full items-center gap-2 px-4 py-2 text-sm',
                        focus ? 'bg-surface-hover text-red-400' : 'text-red-500',
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Sign Out
                    </button>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
