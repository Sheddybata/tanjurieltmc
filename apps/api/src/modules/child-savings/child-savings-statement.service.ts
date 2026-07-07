import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AccountType, TransactionStatus } from '@tanjuriel/database';
import PDFDocument from 'pdfkit';
import { join } from 'path';
import { existsSync } from 'fs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CHILD_SAVINGS_LABEL } from '../../common/utils/child-savings.util';

@Injectable()
export class ChildSavingsStatementService {
  constructor(private prisma: PrismaService) {}

  async getStatement(accountId: string, customerId?: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        branch: { select: { name: true } },
      },
    });

    if (!account) throw new NotFoundException('Account not found');
    if (account.type !== AccountType.MY_PIKIN) {
      throw new NotFoundException('This is not a Child Savings account');
    }
    if (customerId && account.customerId !== customerId) {
      throw new ForbiddenException('Account does not belong to you');
    }

    const endDate = account.maturityDate ?? new Date();
    const transactions = await this.prisma.transaction.findMany({
      where: {
        accountId,
        status: TransactionStatus.COMPLETED,
        createdAt: { lte: endDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalDeposits = transactions
      .filter((t) => t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        type: account.type,
        typeLabel: CHILD_SAVINGS_LABEL,
        label: account.label,
        maturityDate: account.maturityDate,
        contributionFrequency: account.contributionFrequency,
        balance: account.balance,
        availableBalance: account.availableBalance,
        openedAt: account.openedAt,
        childPhotoUrl: account.childPhotoUrl,
        childDateOfBirth: account.childDateOfBirth,
        childSchool: account.childSchool,
        fatherName: account.fatherName,
        motherName: account.motherName,
      },
      member: {
        name: `${account.customer.firstName} ${account.customer.lastName}`,
        phone: account.customer.phone,
        branch: account.branch?.name,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        reference: t.reference,
        type: t.type,
        amount: t.amount,
        status: t.status,
        narration: t.narration,
        createdAt: t.createdAt,
      })),
      summary: {
        totalApprovedTransactions: transactions.length,
        totalDeposits,
        statementThrough: endDate,
      },
      generatedAt: new Date(),
    };
  }

  async generatePdf(accountId: string, customerId?: string): Promise<Buffer> {
    const statement = await this.getStatement(accountId, customerId);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Tanjuriel Microcredit & Thrift Cooperative', { align: 'center' });
      doc.fontSize(14).text('Child Savings Statement', { align: 'center' });
      doc.moveDown();

      const photoUrl = statement.account.childPhotoUrl;
      if (photoUrl) {
        const filename = photoUrl.split('/').pop();
        const localPath = join(process.cwd(), 'uploads', 'child-savings', filename ?? '');
        if (filename && existsSync(localPath)) {
          try {
            doc.image(localPath, doc.x, doc.y, { width: 80, height: 80 });
            doc.moveDown(5);
          } catch {
            // skip missing image on PDF
          }
        }
      }

      doc.fontSize(11);
      doc.text(`Member: ${statement.member.name}`);
      doc.text(`Phone: ${statement.member.phone}`);
      doc.text(`Account number: ${statement.account.accountNumber}`);
      doc.text(`Child: ${statement.account.label ?? '—'}`);
      doc.text(`Date of birth: ${statement.account.childDateOfBirth?.toISOString().slice(0, 10) ?? '—'}`);
      doc.text(`School: ${statement.account.childSchool ?? '—'}`);
      doc.text(`Father: ${statement.account.fatherName ?? '—'}`);
      doc.text(`Mother: ${statement.account.motherName ?? '—'}`);
      doc.text(`Maturity: ${statement.account.maturityDate?.toISOString().slice(0, 10) ?? '—'}`);
      doc.text(`Frequency: ${statement.account.contributionFrequency ?? '—'}`);
      doc.text(`Balance: ₦${Number(statement.account.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
      doc.moveDown();

      doc.fontSize(12).text('Approved transactions', { underline: true });
      doc.moveDown(0.5);

      if (statement.transactions.length === 0) {
        doc.fontSize(10).text('No approved transactions yet.');
      } else {
        doc.fontSize(9);
        for (const t of statement.transactions) {
          const date = new Date(t.createdAt).toISOString().slice(0, 10);
          doc.text(
            `${date}  ${t.reference}  ${t.type}  ₦${Number(t.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}  ${t.narration ?? ''}`,
          );
        }
      }

      doc.moveDown();
      doc.fontSize(8).fillColor('#666').text(
        `Generated ${statement.generatedAt.toISOString()}. Includes manager-approved movements through maturity.`,
        { align: 'center' },
      );

      doc.end();
    });
  }
}
