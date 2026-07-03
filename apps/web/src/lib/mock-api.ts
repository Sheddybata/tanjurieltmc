import { UserProfile } from './api';

const MOCK_USERS: Record<string, UserProfile & { password: string }> = {
  'admin@tanjuriel.com': {
    id: 'mock-admin',
    employeeId: 'EMP001',
    email: 'admin@tanjuriel.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'ADMIN',
    password: 'Password123!',
    branch: { id: 'b1', name: 'Head Office - Jos', code: 'HQ001' },
  },
  'manager@tanjuriel.com': {
    id: 'mock-manager',
    employeeId: 'EMP002',
    email: 'manager@tanjuriel.com',
    firstName: 'Ada',
    lastName: 'Okonkwo',
    role: 'MANAGER',
    password: 'Password123!',
    branch: { id: 'b1', name: 'Head Office - Jos', code: 'HQ001' },
  },
  'teller@tanjuriel.com': {
    id: 'mock-teller',
    employeeId: 'EMP003',
    email: 'teller@tanjuriel.com',
    firstName: 'Chidi',
    lastName: 'Eze',
    role: 'TELLER',
    password: 'Password123!',
    branch: { id: 'b1', name: 'Head Office - Jos', code: 'HQ001' },
  },
};

const MOCK_CUSTOMERS = [
  {
    id: 'c1',
    customerNumber: 'CUS001ABC',
    firstName: 'Fatima',
    lastName: 'Bello',
    phone: '+2348012345678',
    email: 'fatima@example.com',
    bvn: '11111111111',
    nin: '12345678901',
    kycStatus: 'VERIFIED',
    registrationSource: 'BRANCH',
    createdAt: new Date().toISOString(),
    branch: { name: 'Head Office - Jos', code: 'HQ001' },
    accounts: [{ id: 'acc1', accountNumber: 'TMF001XYZ', type: 'SAVINGS', status: 'ACTIVE', balance: 125000 }],
    loans: [],
  },
  {
    id: 'c2',
    customerNumber: 'CUS002DEF',
    firstName: 'Emeka',
    lastName: 'Okafor',
    phone: '+2348098765432',
    kycStatus: 'PENDING',
    registrationSource: 'MOBILE',
    createdAt: new Date().toISOString(),
    branch: { name: 'Head Office - Jos', code: 'HQ001' },
    accounts: [{ id: 'acc2', accountNumber: 'TMF002ABC', type: 'SAVINGS', status: 'ACTIVE', balance: 0 }],
    loans: [],
  },
];

const MOCK_PENDING_KYC = [
  {
    id: 'c3',
    customerNumber: 'CUS003GHI',
    firstName: 'Amina',
    lastName: 'Yusuf',
    phone: '+2348076543210',
    email: 'amina.yusuf@example.com',
    bvn: '22334455667',
    nin: '12345678901',
    kycStatus: 'PENDING',
    registrationSource: 'MOBILE',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    branch: { name: 'Head Office - Jos', code: 'HQ001' },
    accounts: [{ accountNumber: 'TMF003ABC', type: 'SAVINGS' }],
  },
  {
    id: 'c4',
    customerNumber: 'CUS004JKL',
    firstName: 'Ibrahim',
    lastName: 'Musa',
    phone: '+2348065432109',
    email: '',
    bvn: '33445566778',
    nin: '98765432109',
    kycStatus: 'PENDING',
    registrationSource: 'MOBILE',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    branch: { name: 'Head Office - Jos', code: 'HQ001' },
    accounts: [{ accountNumber: 'TMF004DEF', type: 'SAVINGS' }],
  },
];

const MOCK_LOANS = [
  {
    id: 'l1',
    loanNumber: 'LN001XYZ',
    status: 'SUBMITTED',
    principalAmount: 250000,
    tenureMonths: 12,
    monthlyPayment: 23500,
    purpose: 'Shop expansion',
    collateral: '2 commercial sewing machines and workbench',
    collateralType: 'EQUIPMENT',
    collateralEstimatedValue: 180000,
    collateralPhotoUrl: 'mock://collateral/l1.jpg',
    guarantorName: null,
    guarantorPhone: null,
    collateralVerifiedAt: null,
    customer: { firstName: 'Fatima', lastName: 'Bello', customerNumber: 'CUS001ABC', phone: '+2348012345678' },
    product: { name: 'SME Working Capital', code: 'SME-001', requiresCollateral: true },
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'l2',
    loanNumber: 'LN002ABC',
    status: 'UNDER_REVIEW',
    principalAmount: 120000,
    tenureMonths: 6,
    monthlyPayment: 21000,
    purpose: 'School fees support',
    collateral: 'Guarantor: Chidi Eze (staff reference)',
    collateralType: 'OTHER',
    collateralEstimatedValue: null,
    collateralPhotoUrl: null,
    guarantorName: 'Chidi Eze',
    guarantorPhone: '+2348034567890',
    collateralVerifiedAt: new Date().toISOString(),
    customer: { firstName: 'Emeka', lastName: 'Okafor', customerNumber: 'CUS002DEF', phone: '+2348098765432' },
    product: { name: 'Personal Micro Loan', code: 'PERS-001', requiresCollateral: true },
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'l3',
    loanNumber: 'LN003DEF',
    status: 'APPROVED',
    principalAmount: 75000,
    tenureMonths: 6,
    monthlyPayment: 13200,
    purpose: 'Inventory',
    collateral: 'Motorcycle (registration pending)',
    collateralType: 'VEHICLE',
    collateralEstimatedValue: 95000,
    collateralPhotoUrl: 'mock://collateral/l3.jpg',
    collateralVerifiedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    customer: { firstName: 'Emeka', lastName: 'Okafor', customerNumber: 'CUS002DEF', phone: '+2348098765432' },
    product: { name: 'Personal Micro Loan', code: 'PERS-001', requiresCollateral: true },
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  await delay();

  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};

  if (endpoint === '/auth/login' && method === 'POST') {
    const user = MOCK_USERS[body.email?.toLowerCase()];
    if (!user || user.password !== body.password) {
      throw { message: 'Invalid credentials', statusCode: 401 };
    }
    const { password: _, ...profile } = user;
    return {
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 28800,
        user: profile,
      },
    } as T;
  }

  if (endpoint === '/auth/logout') {
    return { success: true, message: 'Logged out' } as T;
  }

  if (endpoint.startsWith('/reporting/dashboard')) {
    return {
      success: true,
      data: {
        totalCustomers: 1284,
        activeAccounts: 956,
        totalDepositsToday: 2450000,
        totalWithdrawalsToday: 890000,
        activeLoans: 342,
        overdueLoans: 18,
        portfolioAtRisk: 0.052,
        totalPortfolio: 48500000,
        pendingApprovals: 7,
        pendingDeposits: 1,
        pendingWithdrawals: 1,
        pendingTransfers: 1,
        totalCustomerBalances: 1250000,
      },
    } as T;
  }

  if (endpoint.startsWith('/reporting/trends')) {
    const trends = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return {
        date: d.toISOString().split('T')[0],
        deposits: 150000 + Math.random() * 200000,
        withdrawals: 80000 + Math.random() * 120000,
      };
    });
    return { success: true, data: trends } as T;
  }

  if (endpoint.startsWith('/reporting/transactions')) {
    return {
      success: true,
      data: {
        summary: [
          { type: 'DEPOSIT', _sum: { amount: 12500000 }, _count: { id: 245 } },
          { type: 'WITHDRAWAL', _sum: { amount: 8200000 }, _count: { id: 189 } },
        ],
      },
    } as T;
  }

  if (endpoint.match(/\/teller\/customers\/[\w-]+$/) && method === 'GET' && !endpoint.includes('pending-kyc')) {
    const id = endpoint.split('/').pop()!;
    const customer = MOCK_CUSTOMERS.find((c) => c.id === id);
    if (!customer) throw { message: 'Customer not found', statusCode: 404 };
    return { success: true, data: customer } as T;
  }

  if (endpoint.match(/\/teller\/accounts\/[\w-]+\/transactions/) && method === 'GET') {
    return {
      success: true,
      data: [
        { id: 'tx1', reference: 'TXN-MOCK-001', type: 'DEPOSIT', amount: 50000, status: 'COMPLETED', createdAt: new Date().toISOString() },
        { id: 'tx2', reference: 'TXN-MOCK-002', type: 'WITHDRAWAL', amount: 10000, status: 'PENDING', createdAt: new Date(Date.now() - 86400000).toISOString() },
      ],
    } as T;
  }

  if (endpoint.match(/\/manager\/loans\/[\w-]+$/) && method === 'GET' && !endpoint.includes('?')) {
    const id = endpoint.split('/').pop()!;
    const loan = MOCK_LOANS.find((l) => l.id === id) || MOCK_LOANS[0];
    return { success: true, data: { ...loan, schedules: [], customer: loan.customer, product: loan.product } } as T;
  }

  if (endpoint.startsWith('/teller/customers/pending-kyc') && method === 'GET') {
    return { success: true, data: MOCK_PENDING_KYC } as T;
  }

  if (endpoint.match(/\/teller\/customers\/[\w-]+\/verify-kyc/) && method === 'PATCH') {
    const id = endpoint.split('/')[3];
    const idx = MOCK_PENDING_KYC.findIndex((c) => c.id === id);
    if (idx >= 0) MOCK_PENDING_KYC.splice(idx, 1);
    return { success: true, data: { id, kycStatus: 'VERIFIED' } } as T;
  }

  if (endpoint.match(/\/teller\/customers\/[\w-]+\/reject-kyc/) && method === 'PATCH') {
    const id = endpoint.split('/')[3];
    const idx = MOCK_PENDING_KYC.findIndex((c) => c.id === id);
    if (idx >= 0) MOCK_PENDING_KYC.splice(idx, 1);
    return { success: true, data: { id, kycStatus: 'REJECTED' } } as T;
  }

  if (endpoint.startsWith('/teller/customers') && method === 'GET') {
    return { success: true, data: MOCK_CUSTOMERS } as T;
  }

  if (endpoint === '/teller/customers' && method === 'POST') {
    return {
      success: true,
      data: { ...body, id: 'c-new', customerNumber: 'CUS' + Date.now(), createdAt: new Date().toISOString() },
    } as T;
  }

  if (endpoint === '/teller/accounts' && method === 'POST') {
    return { success: true, data: { accountNumber: 'TMF' + Date.now(), ...body } } as T;
  }

  if (endpoint === '/teller/deposits' && method === 'POST') {
    return {
      success: true,
      data: {
        transaction: { reference: 'TXN' + Date.now() },
        account: { balance: body.amount + 50000 },
      },
    } as T;
  }

  if (endpoint === '/teller/withdrawals' && method === 'POST') {
    return {
      success: true,
      data: {
        transaction: { reference: 'TXN' + Date.now() },
        account: { balance: 50000 - body.amount },
      },
    } as T;
  }

  if (endpoint.startsWith('/manager/loans') && method === 'GET') {
    const status = new URLSearchParams(endpoint.split('?')[1] || '').get('status');
    const data = status ? MOCK_LOANS.filter((l) => l.status === status) : MOCK_LOANS;
    return { success: true, data } as T;
  }

  if (endpoint.startsWith('/manager/portfolio')) {
    return {
      success: true,
      data: {
        totalOutstanding: 48500000,
        totalDisbursed: 62000000,
        par30: 0.052,
        par60: 0.028,
        par90: 0.015,
        collectionRate: 0.87,
        averageLoanSize: 141812,
        loansByStatus: { SUBMITTED: 7, APPROVED: 12, DISBURSED: 280, OVERDUE: 18, CLOSED: 45 },
      },
    } as T;
  }

  if (endpoint.startsWith('/manager/loan-products')) {
    return {
      success: true,
      data: [
        { id: 'p1', code: 'SME-001', name: 'SME Working Capital', minAmount: 50000, maxAmount: 5000000, interestRate: 0.025, isActive: true },
        { id: 'p2', code: 'PERS-001', name: 'Personal Micro Loan', minAmount: 10000, maxAmount: 500000, interestRate: 0.03, isActive: true },
      ],
    } as T;
  }

  if (endpoint.match(/\/manager\/loans\/[\w-]+\/verify-collateral/) && method === 'POST') {
    const id = endpoint.split('/')[3];
    const loan = MOCK_LOANS.find((l) => l.id === id);
    if (loan) {
      (loan as { collateralVerifiedAt?: string }).collateralVerifiedAt = new Date().toISOString();
    }
    return { success: true, data: loan || MOCK_LOANS[0] } as T;
  }

  if (endpoint.match(/\/manager\/loans\/\w+\/(review|approve|reject|disburse)/)) {
    const id = endpoint.split('/')[3];
    const action = endpoint.split('/').pop();
    const loan = MOCK_LOANS.find((l) => l.id === id) || MOCK_LOANS[0];
    if (action === 'approve') loan.status = 'APPROVED';
    if (action === 'reject') loan.status = 'REJECTED';
    if (action === 'review') loan.status = 'UNDER_REVIEW';
    return { success: true, data: loan } as T;
  }

  if (endpoint.startsWith('/audit/logs')) {
    return {
      success: true,
      data: [
        { id: 'a1', action: 'LOGIN', entityType: 'auth', entityId: 'mock-teller', createdAt: new Date().toISOString(), user: { firstName: 'Chidi', lastName: 'Eze', email: 'teller@tanjuriel.com', role: 'TELLER' } },
        { id: 'a2', action: 'CREATE', entityType: 'teller', entityId: 'c1', createdAt: new Date(Date.now() - 3600000).toISOString(), user: { firstName: 'Chidi', lastName: 'Eze', email: 'teller@tanjuriel.com', role: 'TELLER' } },
      ],
    } as T;
  }

  if (endpoint.startsWith('/users')) {
    return {
      success: true,
      data: Object.values(MOCK_USERS).map(({ password: _, ...u }) => u),
    } as T;
  }

  const MOCK_SETTLEMENT_ACCOUNTS = [
    {
      provider: 'ZENITH',
      bankName: 'Zenith Bank',
      accountName: 'Tanjuriel Thrift and Microcredit Cooperative LTD',
      accountNumber: '1234567890',
      instructions: 'Use your payment reference in the transfer narration.',
      isActive: true,
    },
    {
      provider: 'OPAY',
      bankName: 'Opay',
      accountName: 'Tanjuriel Thrift and Microcredit Cooperative LTD',
      accountNumber: '8012345678',
      instructions: 'Use your payment reference in the transfer note.',
      isActive: true,
    },
    {
      provider: 'MONIEPOINT',
      bankName: 'Moniepoint',
      accountName: 'Tanjuriel Thrift and Microcredit Cooperative LTD',
      accountNumber: '5678901234',
      instructions: 'Use your payment reference when sending money.',
      isActive: true,
    },
  ];

  const MOCK_PAYMENT_REQUESTS = [
    {
      id: 'pr1',
      reference: 'PRQ001MOCK',
      type: 'DEPOSIT',
      status: 'PENDING',
      amount: 50000,
      channel: 'BANK_TRANSFER',
      settlementProvider: 'ZENITH',
      customerNote: 'Salary deposit',
      createdAt: new Date().toISOString(),
      account: {
        accountNumber: 'TMF001XYZ',
        customer: {
          firstName: 'Fatima',
          lastName: 'Bello',
          phone: '+2348012345678',
          paymentRef: 'TJM-REF001',
        },
      },
      initiatedBy: { firstName: 'Chidi', lastName: 'Eze', role: 'TELLER' },
    },
    {
      id: 'pr2',
      reference: 'PRQ002MOCK',
      type: 'WITHDRAWAL',
      status: 'PENDING',
      amount: 25000,
      channel: 'CASH',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      account: {
        accountNumber: 'TMF001XYZ',
        customer: {
          firstName: 'Fatima',
          lastName: 'Bello',
          phone: '+2348012345678',
          paymentRef: 'TJM-REF001',
        },
      },
      initiatedBy: { firstName: 'Chidi', lastName: 'Eze', role: 'TELLER' },
    },
    {
      id: 'pr3',
      reference: 'PRQ003MOCK',
      type: 'TRANSFER',
      status: 'PENDING',
      amount: 75000,
      channel: 'MOBILE',
      beneficiaryBank: 'GTBank',
      beneficiaryAccount: '0123456789',
      beneficiaryName: 'John Doe',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      account: {
        accountNumber: 'TMF001XYZ',
        customer: {
          firstName: 'Fatima',
          lastName: 'Bello',
          phone: '+2348012345678',
          paymentRef: 'TJM-REF001',
        },
      },
    },
  ];

  if (endpoint.startsWith('/operations/reconciliation')) {
    return {
      success: true,
      data: {
        totalCustomerBalances: 1250000,
        totalHeldBalances: 100000,
        pendingDepositCount: 1,
        pendingDepositAmount: 50000,
        pendingOutboundCount: 2,
        pendingOutboundAmount: 100000,
        settlementAccounts: MOCK_SETTLEMENT_ACCOUNTS,
        note: 'Compare total customer balances against actual funds in your Zenith, Opay, and Moniepoint accounts.',
      },
    } as T;
  }

  if (endpoint.startsWith('/operations/pending')) {
    return {
      success: true,
      data: MOCK_PAYMENT_REQUESTS,
      meta: { total: MOCK_PAYMENT_REQUESTS.length, page: 1, limit: 50 },
    } as T;
  }

  if (endpoint.match(/\/operations\/[\w-]+\/(approve|reject)/)) {
    return { success: true, data: { ...MOCK_PAYMENT_REQUESTS[0], status: 'APPROVED' } } as T;
  }

  if (endpoint.startsWith('/settings/settlement-accounts')) {
    if (method === 'PUT') {
      return { success: true, data: { provider: 'ZENITH', ...MOCK_SETTLEMENT_ACCOUNTS[0] } } as T;
    }
    return { success: true, data: MOCK_SETTLEMENT_ACCOUNTS } as T;
  }

  return { success: true, data: {} } as T;
}
