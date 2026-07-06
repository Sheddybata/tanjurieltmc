import { UserRole } from '@tanjuriel/shared';

import {

  LayoutDashboard,

  Users,

  UserPlus,

  Wallet,

  ArrowDownLeft,

  ArrowUpRight,

  FileText,

  CheckCircle,

  BarChart3,

  Shield,

  Building2,

  CreditCard,

  Banknote,

  Settings,

  Scale,

  ClipboardList,

  LucideIcon,

} from 'lucide-react';



export type NavGroupId = 'overview' | 'operations' | 'credit' | 'administration' | 'teller';



export interface NavItem {

  label: string;

  href: string;

  icon: LucideIcon;

  roles: UserRole[];

  group: NavGroupId;

}



export const NAV_GROUP_LABELS: Record<NavGroupId, string> = {

  overview: 'Overview',

  teller: 'Teller desk',

  operations: 'Operations',

  credit: 'Credit & loans',

  administration: 'Administration',

};



export const NAV_GROUP_ORDER: NavGroupId[] = [

  'overview',

  'teller',

  'operations',

  'credit',

  'administration',

];



export const NAV_ITEMS: NavItem[] = [

  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TELLER], group: 'overview' },

  { label: 'Register Customer', href: '/teller/customers/new', icon: UserPlus, roles: [UserRole.TELLER], group: 'teller' },

  { label: 'Mobile Registrations', href: '/teller/registrations', icon: ClipboardList, roles: [UserRole.TELLER], group: 'teller' },

  { label: 'Customers', href: '/teller/customers', icon: Users, roles: [UserRole.TELLER], group: 'teller' },

  { label: 'Open Account', href: '/teller/accounts/new', icon: Wallet, roles: [UserRole.TELLER], group: 'teller' },

  { label: 'Deposits', href: '/teller/deposits', icon: ArrowDownLeft, roles: [UserRole.TELLER], group: 'teller' },

  { label: 'Withdrawals', href: '/teller/withdrawals', icon: ArrowUpRight, roles: [UserRole.TELLER], group: 'teller' },

  { label: 'Loan Repayments', href: '/teller/loan-repayments', icon: Banknote, roles: [UserRole.TELLER], group: 'teller' },

  { label: 'Operations Queue', href: '/manager/operations', icon: ClipboardList, roles: [UserRole.MANAGER, UserRole.ADMIN], group: 'operations' },

  { label: 'Reconciliation', href: '/manager/reconciliation', icon: Scale, roles: [UserRole.MANAGER, UserRole.ADMIN], group: 'operations' },

  { label: 'Loan Applications', href: '/manager/loans', icon: FileText, roles: [UserRole.MANAGER, UserRole.ADMIN], group: 'credit' },

  { label: 'Loan Approvals', href: '/manager/approvals', icon: CheckCircle, roles: [UserRole.MANAGER, UserRole.ADMIN], group: 'credit' },

  { label: 'Portfolio', href: '/manager/portfolio', icon: BarChart3, roles: [UserRole.MANAGER, UserRole.ADMIN], group: 'credit' },

  { label: 'Reports', href: '/reports', icon: BarChart3, roles: [UserRole.ADMIN, UserRole.MANAGER], group: 'operations' },

  { label: 'User Management', href: '/admin/users', icon: Users, roles: [UserRole.ADMIN], group: 'administration' },

  { label: 'Audit Logs', href: '/admin/audit', icon: Shield, roles: [UserRole.ADMIN, UserRole.MANAGER], group: 'administration' },

  { label: 'Branches', href: '/admin/branches', icon: Building2, roles: [UserRole.ADMIN], group: 'administration' },

  { label: 'Loan Products', href: '/admin/products', icon: CreditCard, roles: [UserRole.ADMIN], group: 'administration' },

  { label: 'Settings', href: '/admin/settings', icon: Settings, roles: [UserRole.ADMIN], group: 'administration' },

];



export function getNavForRole(role: UserRole): NavItem[] {

  return NAV_ITEMS.filter((item) => item.roles.includes(role));

}



export function getNavGroupsForRole(role: UserRole): { id: NavGroupId; label: string; items: NavItem[] }[] {

  const items = getNavForRole(role);

  return NAV_GROUP_ORDER.map((id) => ({

    id,

    label: NAV_GROUP_LABELS[id],

    items: items.filter((item) => item.group === id),

  })).filter((group) => group.items.length > 0);

}



export const ROLE_LABELS: Record<UserRole, string> = {

  [UserRole.ADMIN]: 'Administrator',

  [UserRole.MANAGER]: 'Branch Manager',

  [UserRole.TELLER]: 'Teller',

};



export const ROLE_COLORS: Record<UserRole, string> = {

  [UserRole.ADMIN]: 'bg-purple-100 text-purple-700',

  [UserRole.MANAGER]: 'bg-blue-100 text-blue-700',

  [UserRole.TELLER]: 'bg-emerald-100 text-emerald-700',

};

