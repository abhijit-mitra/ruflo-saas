import { Fragment } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { BuildingOfficeIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useOrgStore } from '@/store/orgStore';

export default function OrgSwitcher() {
  const { currentOrg, orgs, setCurrentOrg } = useOrgStore();

  if (orgs.length === 0) return null;

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
        <BuildingOfficeIcon className="h-4 w-4" />
        <span className="max-w-[120px] truncate">
          {currentOrg?.name || 'Select Org'}
        </span>
        <ChevronDownIcon className="h-3 w-3" />
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
        <MenuItems className="absolute right-0 mt-2 w-64 origin-top-right rounded-lg bg-surface-card border border-border shadow-lg shadow-black/30 focus:outline-none z-50">
          <div className="border-b border-border px-4 py-2">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Organizations
            </p>
          </div>
          <div className="py-1 max-h-60 overflow-y-auto">
            {orgs.map((org) => (
              <MenuItem key={org.id}>
                {({ focus }) => (
                  <button
                    onClick={() => setCurrentOrg(org)}
                    className={clsx(
                      'flex w-full items-center justify-between px-4 py-2 text-sm',
                      focus ? 'bg-surface-hover text-text-primary' : 'text-text-secondary',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{org.name}</span>
                    </div>
                    {currentOrg?.id === org.id && (
                      <CheckIcon className="h-4 w-4 text-primary" />
                    )}
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
