export type StaffRole = 'ADMIN' | 'MANAGER' | 'TELLER' | 'ACCOUNT_OFFICER';

export function canAccessPath(role: StaffRole, pathname: string): boolean {
  if (pathname === '/dashboard' || pathname === '/login' || pathname === '/staff/login') return true;
  if (role === 'ACCOUNT_OFFICER') {
    return pathname.startsWith('/account-officer');
  }
  if (pathname.startsWith('/account-officer')) return false;
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

export function staffLoanBasePath(role?: string): '/teller/loans' | '/manager/loans' {
  return role === 'TELLER' ? '/teller/loans' : '/manager/loans';
}

export function accessDeniedRedirect(role: StaffRole): string {
  if (role === 'ACCOUNT_OFFICER') return '/account-officer/dashboard';
  return '/dashboard';
}

export function staffHomePath(role: StaffRole): string {
  if (role === 'ACCOUNT_OFFICER') return '/account-officer/dashboard';
  return '/dashboard';
}
