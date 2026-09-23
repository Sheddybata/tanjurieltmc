import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  if (process.env.RESET_OPERATIONAL_DATA !== 'YES') {
    throw new Error(
      'Refusing to run. Set RESET_OPERATIONAL_DATA=YES to delete all customers, loans, and staff.',
    );
  }

  console.log('Resetting operational data for production...');

  const counts = await prisma.$transaction(
    async (tx) => {
      const deleted = {
        paymentRequestApprovals: (await tx.paymentRequestApproval.deleteMany()).count,
        transactions: (await tx.transaction.deleteMany()).count,
        billPayments: (await tx.billPayment.deleteMany()).count,
        paymentRequests: (await tx.paymentRequest.deleteMany()).count,
        loanApprovals: (await tx.loanApproval.deleteMany()).count,
        loanSchedules: (await tx.loanSchedule.deleteMany()).count,
        loans: (await tx.loan.deleteMany()).count,
        accounts: (await tx.account.deleteMany()).count,
        customerRefreshTokens: (await tx.customerRefreshToken.deleteMany()).count,
        notifications: (await tx.notification.deleteMany()).count,
        customers: (await tx.customer.deleteMany()).count,
        refreshTokens: (await tx.refreshToken.deleteMany()).count,
        auditLogs: (await tx.auditLog.deleteMany()).count,
        nibssTransactions: (await tx.nibssTransaction.deleteMany()).count,
        dailySnapshots: (await tx.dailySnapshot.deleteMany()).count,
        users: (await tx.user.deleteMany()).count,
      };
      return deleted;
    },
    { timeout: 120_000 },
  );

  console.log('Deleted:', counts);

  let branch = await prisma.branch.findFirst({ where: { code: 'JOS001' } });
  if (!branch) {
    branch = await prisma.branch.findFirst({ orderBy: { createdAt: 'asc' } });
  }
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        code: 'JOS001',
        name: 'Head Office - Jos',
        address: 'Ebomi Opposite Indomi Plaza',
        city: 'Jos',
        state: 'Plateau',
      },
    });
  }

  const email = (process.env.PRODUCTION_ADMIN_EMAIL || 'admin@tanjurieltmc.com').toLowerCase();
  const password = process.env.PRODUCTION_ADMIN_PASSWORD || randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      employeeId: 'EMP001',
      email,
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      branchId: branch.id,
    },
  });

  console.log('Production reset complete.');
  console.log(`  Branch kept: ${branch.name} (${branch.code})`);
  console.log('  Loan products, settlement accounts, and bill categories were kept.');
  console.log(`  Admin email: ${email}`);
  console.log(`  Admin password: ${password}`);
  console.log('  Change this password after first login.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
