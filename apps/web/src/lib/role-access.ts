export type StaffRole = 'ADMIN' | 'MANAGER' | 'TELLER';

export function canAccessPath(role: StaffRole, pathname: string): boolean {
  if (pathname === '/dashboard' || pathname === '/login' || pathname === '/staff/login') return true;
  if (pathname.startsWith('/reports')) return role === 'ADMIN' || role === 'MANAGER';
  if (pathname.startsWith('/admin')) return role === 'ADMIN';
  if (pathname.startsWith('/manager')) return role === 'ADMIN' || role === 'MANAGER';
  if (pathname.startsWith('/teller/customers') || pathname.startsWith('/teller/accounts/new')) {
    return role === 'ADMIN' || role === 'MANAGER' || role === 'TELLER';
  }
  if (pathname.startsWith('/teller/child-savings') || pathname.startsWith('/teller/transfers')) {
    return role === 'ADMIN' || role === 'TELLER';
  }
  if (pathname.startsWith('/teller')) return role === 'ADMIN' || role === 'TELLER';
  return true;
}

export function accessDeniedRedirect(role: StaffRole): string {
  return '/dashboard';
}
