export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TELLER = 'TELLER',
}

export enum Permission {
  // User management
  MANAGE_USERS = 'manage:users',
  VIEW_USERS = 'view:users',

  // Customer & accounts
  REGISTER_CUSTOMER = 'register:customer',
  OPEN_ACCOUNT = 'open:account',
  VIEW_CUSTOMERS = 'view:customers',

  // Transactions
  SUBMIT_DEPOSIT = 'submit:deposit',
  SUBMIT_WITHDRAWAL = 'submit:withdrawal',
  PROCESS_DEPOSIT = 'process:deposit',
  PROCESS_WITHDRAWAL = 'process:withdrawal',
  APPROVE_DEPOSIT = 'approve:deposit',
  APPROVE_WITHDRAWAL = 'approve:withdrawal',
  APPROVE_TRANSFER = 'approve:transfer',
  APPROVE_PAYMENT_REQUEST = 'approve:payment_request',
  VIEW_PENDING_REQUESTS = 'view:pending_requests',
  REVERSE_TRANSACTION = 'reverse:transaction',
  VIEW_TRANSACTIONS = 'view:transactions',

  // Loans
  CREATE_LOAN = 'create:loan',
  REVIEW_LOAN = 'review:loan',
  APPROVE_LOAN = 'approve:loan',
  DISBURSE_LOAN = 'disburse:loan',
  VIEW_LOANS = 'view:loans',
  VIEW_PORTFOLIO = 'view:portfolio',

  // Reporting
  VIEW_REPORTS = 'view:reports',
  EXPORT_REPORTS = 'export:reports',
  VIEW_DASHBOARD = 'view:dashboard',

  // Audit
  VIEW_AUDIT_LOGS = 'view:audit_logs',

  // System
  MANAGE_BRANCHES = 'manage:branches',
  MANAGE_PRODUCTS = 'manage:products',
  MANAGE_SETTLEMENT_ACCOUNTS = 'manage:settlement_accounts',
  VIEW_RECONCILIATION = 'view:reconciliation',
  SYSTEM_SETTINGS = 'system:settings',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.MANAGER]: [
    Permission.VIEW_USERS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_TRANSACTIONS,
    Permission.VIEW_PENDING_REQUESTS,
    Permission.APPROVE_PAYMENT_REQUEST,
    Permission.VIEW_RECONCILIATION,
    Permission.CREATE_LOAN,
    Permission.REVIEW_LOAN,
    Permission.APPROVE_LOAN,
    Permission.DISBURSE_LOAN,
    Permission.VIEW_LOANS,
    Permission.VIEW_PORTFOLIO,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_AUDIT_LOGS,
  ],
  [UserRole.TELLER]: [
    Permission.REGISTER_CUSTOMER,
    Permission.OPEN_ACCOUNT,
    Permission.VIEW_CUSTOMERS,
    Permission.SUBMIT_DEPOSIT,
    Permission.SUBMIT_WITHDRAWAL,
    Permission.PROCESS_DEPOSIT,
    Permission.PROCESS_WITHDRAWAL,
    Permission.VIEW_TRANSACTIONS,
    Permission.VIEW_DASHBOARD,
  ],
};

export const CURRENCY = 'NGN' as const;

export const ACCOUNT_NUMBER_PREFIX = 'TMF';

export const LOAN_NUMBER_PREFIX = 'LN';

export const CUSTOMER_NUMBER_PREFIX = 'CUS';

export const TRANSACTION_REF_PREFIX = 'TXN';

export const PAYMENT_REQUEST_REF_PREFIX = 'REQ';

export const PAYMENT_REF_PREFIX = 'TJC';

/** Internal account type codes → user-facing labels */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  SAVINGS: 'Savings',
  DAILY_SAVINGS: 'Daily Savings',
  MY_PIKIN: 'Child Savings',
  CURRENT: 'Current',
  FIXED_DEPOSIT: 'Fixed Deposit',
  LOAN: 'Loan',
};

export function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

export type AuthType = 'staff' | 'customer';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: string;
  authType: AuthType;
  email?: string;
  phone?: string;
  role?: UserRole;
  branchId?: string;
  employeeId?: string;
  customerId?: string;
}

export interface CustomerJwtPayload {
  sub: string;
  authType: 'customer';
  phone: string;
  customerId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DashboardMetrics {
  totalCustomers: number;
  activeAccounts: number;
  totalDepositsToday: number;
  totalWithdrawalsToday: number;
  activeLoans: number;
  overdueLoans: number;
  portfolioAtRisk: number;
  totalPortfolio: number;
  pendingApprovals: number;
  pendingDeposits: number;
  pendingTransfers: number;
  pendingWithdrawals: number;
  totalCustomerBalances: number;
}

export interface PortfolioSummary {
  totalOutstanding: number;
  totalDisbursed: number;
  par30: number;
  par60: number;
  par90: number;
  collectionRate: number;
  averageLoanSize: number;
  loansByStatus: Record<string, number>;
}
