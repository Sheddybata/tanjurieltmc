'use client';



import Link from 'next/link';

import { usePathname } from 'next/navigation';

import { LogOut, Landmark } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';

import { getNavGroupsForRole, ROLE_LABELS, ROLE_COLORS } from '@/lib/navigation';

import { cn } from '@/lib/utils';

import { UserRole } from '@tanjuriel/shared';



export function Sidebar() {

  const pathname = usePathname();

  const { user, logout } = useAuth();



  if (!user) return null;



  const navGroups = getNavGroupsForRole(user.role as UserRole);



  return (

    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white">

      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 shadow-sm">

          <Landmark className="h-5 w-5 text-white" />

        </div>

        <div>

          <p className="font-display text-sm font-bold text-gray-900">Tanjuriel</p>

          <p className="text-xs text-gray-500">Operations console</p>

        </div>

      </div>



      <nav className="flex-1 overflow-y-auto px-3 py-4">

        {navGroups.map((group, groupIndex) => (

          <div key={group.id} className={cn(groupIndex > 0 && 'mt-6')}>

            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">

              {group.label}

            </p>

            <ul className="space-y-0.5">

              {group.items.map((item) => {

                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (

                  <li key={item.href}>

                    <Link

                      href={item.href}

                      className={cn(

                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',

                        isActive

                          ? 'bg-brand-600 text-white shadow-sm'

                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',

                      )}

                    >

                      <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-gray-400')} />

                      {item.label}

                    </Link>

                  </li>

                );

              })}

            </ul>

          </div>

        ))}

      </nav>



      <div className="border-t border-gray-100 p-4">

        <div className="mb-3 rounded-xl border border-gray-100 bg-surface-secondary p-3">

          <p className="truncate text-sm font-semibold text-gray-900">

            {user.firstName} {user.lastName}

          </p>

          <p className="truncate text-xs text-gray-500">{user.email}</p>

          <span className={cn('badge mt-2', ROLE_COLORS[user.role as UserRole])}>

            {ROLE_LABELS[user.role as UserRole]}

          </span>

        </div>

        <button

          type="button"

          onClick={() => logout().then(() => (window.location.href = '/login'))}

          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"

        >

          <LogOut className="h-4 w-4" />

          Sign out

        </button>

      </div>

    </aside>

  );

}

