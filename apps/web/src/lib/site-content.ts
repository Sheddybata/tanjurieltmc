export const SITE = {
  name: 'Tanjuriel Microfinance',
  shortName: 'Tanjuriel',
  tagline: 'Empowering communities through accessible financial services',
  description:
    'Tanjuriel Microfinance helps individuals, families, and small businesses save, borrow, and grow with products built for everyday Nigerian life.',
  email: 'hello@tanjuriel.com',
  phone: '+234 800 000 0000',
  whatsapp: '+234 800 000 0000',
  address: 'Lagos, Nigeria',
  androidDownloadUrl: process.env.NEXT_PUBLIC_ANDROID_APP_URL ?? '/downloads/tanjuriel-android.apk',
  iosDownloadUrl: process.env.NEXT_PUBLIC_IOS_APP_URL ?? '/downloads/tanjuriel-ios.ipa',
};

export const NAV = {
  personal: [
    { label: 'Daily Savings', href: '/personal/savings#daily-savings' },
    { label: 'My Pikin Savings', href: '/personal/savings#my-pikin' },
    { label: 'Loans', href: '/personal/loans' },
  ],
  about: [
    { label: 'Our Story', href: '/about' },
    { label: 'Mission & Vision', href: '/about/mission-vision' },
  ],
  main: [
    { label: 'Home', href: '/' },
    { label: 'Personal', href: '/personal/savings', hasDropdown: true },
    { label: 'Business', href: '/business' },
    { label: 'About', href: '/about', hasDropdown: true },
    { label: 'Support', href: '/support' },
  ],
};

export const SAVINGS_PRODUCTS = [
  {
    id: 'daily-savings',
    name: 'Daily Savings',
    slug: 'daily-savings',
    headline: 'Save a little, every day',
    summary:
      'Build your savings habit with small daily deposits. Perfect for market traders, artisans, and anyone who earns day to day.',
    description:
      'Daily Savings is designed for people who want to grow their money steadily without waiting for a large lump sum. Drop in what you can each day — at a branch or through our mobile app — and watch your balance grow over time.',
    features: [
      'Open with a low minimum deposit',
      'Save daily, weekly, or whenever you can',
      'Track your balance on the mobile app',
      'Withdrawals processed with manager approval for your security',
      'Ideal for building an emergency fund or business float',
    ],
    idealFor: 'Traders, self-employed workers, and savers who prefer small, frequent contributions',
    accent: 'emerald' as const,
  },
  {
    id: 'my-pikin',
    name: 'My Pikin Savings',
    slug: 'my-pikin',
    headline: 'Invest in your child\'s future',
    summary:
      'A dedicated savings account for your child, locked until maturity so their future stays protected.',
    description:
      'My Pikin Savings lets parents and guardians set aside money for a child\'s education, apprenticeship, or future needs. You choose a maturity date and a label for the account — funds stay locked until then, so the savings truly grow for your pikin.',
    features: [
      'Named account for each child (e.g. "Ada Eze")',
      'Set a maturity date that fits your goal',
      'Funds locked until maturity — no app transfers or withdrawals',
      'Withdraw at branch after maturity, with manager approval',
      'Teaches long-term saving for the whole family',
    ],
    idealFor: 'Parents and guardians saving for school fees, skills training, or a child\'s future',
    accent: 'amber' as const,
  },
];

export const LOAN_PRODUCTS = [
  {
    code: 'PERS-001',
    name: 'Personal Micro Loan',
    description: 'Flexible personal loans for salaried and self-employed clients who need quick access to funds.',
    minAmount: 10_000,
    maxAmount: 500_000,
    minTenureMonths: 1,
    maxTenureMonths: 12,
    interestRate: 0.03,
    requiresCollateral: true,
  },
  {
    code: 'SME-001',
    name: 'SME Working Capital',
    description: 'Short-term working capital to help small businesses restock, pay suppliers, or manage cash flow.',
    minAmount: 50_000,
    maxAmount: 5_000_000,
    minTenureMonths: 3,
    maxTenureMonths: 24,
    interestRate: 0.025,
    requiresCollateral: true,
  },
];

export const BUSINESS_SERVICES = [
  {
    title: 'SME Working Capital Loans',
    description: 'Fund inventory, pay suppliers, or cover seasonal gaps with structured repayment plans.',
  },
  {
    title: 'Business Savings',
    description: 'Separate your business float from personal money with dedicated savings accounts.',
  },
  {
    title: 'Group & Market Support',
    description: 'Products tailored for cooperatives, market associations, and community savings groups.',
  },
  {
    title: 'Relationship Support',
    description: 'Talk to our team about your business needs — we help you find the right product.',
  },
];

export const VALUES = [
  {
    title: 'Inclusion',
    description: 'Financial services that meet people where they are — not just where banks traditionally go.',
  },
  {
    title: 'Integrity',
    description: 'Clear terms, honest advice, and transparent processes on every account and loan.',
  },
  {
    title: 'Community',
    description: 'We grow when our customers and neighbourhoods grow. Your success is our purpose.',
  },
  {
    title: 'Security',
    description: 'Role-based controls, audit trails, and approval workflows protect every transaction.',
  },
];

export const MISSION_VISION = {
  mission:
    'To provide accessible, trustworthy financial services that help individuals, families, and small businesses save, borrow, and build a more secure future.',
  vision:
    'A Nigeria where every hardworking person — trader, artisan, parent, or entrepreneur — has a financial partner they can rely on.',
};

export const APP_FEATURES = [
  { title: 'Check balances', description: 'View all your accounts including Daily Savings and My Pikin in one place.' },
  { title: 'Save & transfer', description: 'Make deposits, request transfers, and pay bills from your phone.' },
  { title: 'Transaction history', description: 'Full history and receipts for every movement on your account.' },
  { title: 'Loan applications', description: 'Browse loan products and start an application in-app.' },
  { title: 'Secure PIN login', description: 'Biometric and PIN protection keep your account safe.' },
  { title: 'KYC onboarding', description: 'Complete verification steps to unlock full account features.' },
];

export const FAQ = [
  {
    q: 'How do I open a Daily Savings account?',
    a: 'Visit any Tanjuriel branch with a valid ID, or register through our mobile app and complete KYC. A teller will help you open your Daily Savings account with your first deposit.',
  },
  {
    q: 'What is My Pikin Savings?',
    a: 'My Pikin is a child savings account. You name the account after your child and set a maturity date. Before maturity, funds stay locked. After maturity, you can request a withdrawal on the mobile app; a manager must approve before you collect cash at your branch.',
  },
  {
    q: 'Can I withdraw from My Pikin early?',
    a: 'My Pikin accounts are designed to stay locked until maturity to protect your child\'s savings. Please speak with a branch manager if you have an exceptional need.',
  },
  {
    q: 'How do I apply for a loan?',
    a: 'Browse our loan products on this website or in the mobile app, then visit a branch or apply in-app. Our team will guide you through documentation and approval.',
  },
  {
    q: 'Is the mobile app free?',
    a: 'Yes. Download the Tanjuriel app at no cost. Standard transaction fees may apply depending on the service.',
  },
  {
    q: 'How do I reach customer support?',
    a: 'Call us, send a WhatsApp message, or visit any branch. See our Contact page for details.',
  },
];

export const HOMEPAGE_STATS = [
  { value: '2', label: 'Savings products built for real life' },
  { value: '100%', label: 'Community-focused service' },
  { value: '24/7', label: 'Mobile app access to your accounts' },
];
