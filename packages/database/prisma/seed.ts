import { PrismaClient, UserRole, Gender, AccountType, AccountStatus, SettlementProvider } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function paymentRef(customerNumber: string) {
  return `TJC-${customerNumber}`;
}

async function main() {
  console.log('Seeding Tanjuriel Microfinance database...');

  const branch = await prisma.branch.upsert({
    where: { code: 'JOS001' },
    update: {},
    create: {
      code: 'JOS001',
      name: 'Head Office - Jos',
      address: 'Ebomi Opposite Indomi Plaza',
      city: 'Jos',
      state: 'Plateau',
      phone: '+2348012345678',
    },
  });

  const passwordHash = await bcrypt.hash('Password123!', 12);
  const customerPinHash = await bcrypt.hash('1234', 12);

  await prisma.user.upsert({
    where: { email: 'admin@tanjuriel.com' },
    update: {},
    create: {
      employeeId: 'EMP001',
      email: 'admin@tanjuriel.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      branchId: branch.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@tanjuriel.com' },
    update: {},
    create: {
      employeeId: 'EMP002',
      email: 'manager@tanjuriel.com',
      passwordHash,
      firstName: 'Ada',
      lastName: 'Okonkwo',
      role: UserRole.MANAGER,
      branchId: branch.id,
    },
  });

  const teller = await prisma.user.upsert({
    where: { email: 'teller@tanjuriel.com' },
    update: {},
    create: {
      employeeId: 'EMP003',
      email: 'teller@tanjuriel.com',
      passwordHash,
      firstName: 'Chidi',
      lastName: 'Eze',
      role: UserRole.TELLER,
      branchId: branch.id,
    },
  });

  const settlementAccounts = [
    {
      provider: SettlementProvider.ZENITH,
      bankName: 'Zenith Bank',
      accountName: 'Tanjuriel Thrift and Microcredit Cooperative LTD',
      accountNumber: '0000000000',
      instructions: 'Use your payment reference in the transfer narration.',
    },
    {
      provider: SettlementProvider.OPAY,
      bankName: 'Opay',
      accountName: 'Tanjuriel Thrift and Microcredit Cooperative LTD',
      accountNumber: '0000000000',
      instructions: 'Use your payment reference in the transfer narration.',
    },
    {
      provider: SettlementProvider.MONIEPOINT,
      bankName: 'Moniepoint',
      accountName: 'Tanjuriel Thrift and Microcredit Cooperative LTD',
      accountNumber: '0000000000',
      instructions: 'Use your payment reference in the transfer narration.',
    },
  ];

  for (const account of settlementAccounts) {
    await prisma.settlementAccount.upsert({
      where: { provider: account.provider },
      update: account,
      create: account,
    });
  }

  const customerNumber = 'CUSSEED001';
  const demoCustomer = await prisma.customer.upsert({
    where: { customerNumber },
    update: {
      pinHash: customerPinHash,
      appEnabled: true,
      paymentRef: paymentRef(customerNumber),
    },
    create: {
      customerNumber,
      paymentRef: paymentRef(customerNumber),
      firstName: 'Demo',
      lastName: 'Customer',
      dateOfBirth: new Date('1990-01-15'),
      gender: Gender.MALE,
      phone: '08012345678',
      email: 'demo.customer@tanjuriel.com',
      address: 'Jos North',
      city: 'Jos',
      state: 'Plateau',
      kycStatus: 'VERIFIED',
      pinHash: customerPinHash,
      appEnabled: true,
      branchId: branch.id,
      registeredById: teller.id,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: 'TMFSEED001' },
    update: {},
    create: {
      accountNumber: 'TMFSEED001',
      type: AccountType.SAVINGS,
      status: AccountStatus.ACTIVE,
      balance: 0,
      availableBalance: 0,
      heldBalance: 0,
      customerId: demoCustomer.id,
      branchId: branch.id,
      openedById: teller.id,
      openedAt: new Date(),
    },
  });

  await prisma.loanProduct.upsert({
    where: { code: 'SME-001' },
    update: {},
      create: {
        code: 'SME-001',
        name: 'SME Working Capital',
        description: 'Short-term working capital for small businesses',
        minAmount: 50000,
        maxAmount: 5000000,
        minTenureMonths: 3,
        maxTenureMonths: 24,
        interestRate: 0.025,
        processingFee: 2500,
        requiresCollateral: true,
      },
  });

  await prisma.loanProduct.upsert({
    where: { code: 'PERS-001' },
    update: {},
      create: {
        code: 'PERS-001',
        name: 'Personal Micro Loan',
        description: 'Personal loans for salaried and self-employed clients',
        minAmount: 10000,
        maxAmount: 500000,
        minTenureMonths: 1,
        maxTenureMonths: 12,
        interestRate: 0.03,
        processingFee: 500,
        requiresCollateral: true,
      },
  });

  const categories = [
    { code: 'ELECTRICITY', name: 'Electricity' },
    { code: 'AIRTIME', name: 'Airtime & Data' },
    { code: 'CABLE', name: 'Cable TV' },
    { code: 'WATER', name: 'Water' },
  ];

  for (const cat of categories) {
    await prisma.billPaymentCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  console.log('Seed complete.');
  console.log('  Admin:   admin@tanjuriel.com / Password123!');
  console.log('  Manager: manager@tanjuriel.com / Password123!');
  console.log('  Teller:  teller@tanjuriel.com / Password123!');
  console.log('  Customer app: 08012345678 / PIN 1234');
  console.log(`  Branch:  ${branch.name} (${branch.code})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
