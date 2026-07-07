import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalAction, LoanStatus } from '@tanjuriel/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LOAN_CONTRACT_VERSION } from '../../common/constants/loan-contract.constant';
import {
  calculateTanjuielLoanQuote,
  LOAN_PRODUCT_CODE_BY_CATEGORY,
} from '../../common/utils/loan-pricing.util';
import { generateLoanNumber } from '../../common/utils/reference.util';
import { CustomerApplyLoanDto, CustomerLoanQuoteDto } from '../customer/dto/customer-loan.dto';

export type LoanApplicationSource = 'MOBILE' | 'BRANCH';

export interface CreateLoanApplicationInput {
  customerId: string;
  dto: Omit<CustomerApplyLoanDto, 'pin'>;
  collateralPhotoUrl?: string;
  actorId: string;
  source: LoanApplicationSource;
}

@Injectable()
export class LoanApplicationService {
  constructor(private prisma: PrismaService) {}

  quoteLoan(dto: CustomerLoanQuoteDto) {
    return calculateTanjuielLoanQuote({
      principalAmount: dto.principalAmount,
      tenurePeriods: dto.tenurePeriods,
      repaymentPlan: dto.repaymentPlan,
    });
  }

  async createApplication(input: CreateLoanApplicationInput) {
    const { customerId, dto, collateralPhotoUrl, actorId, source } = input;

    if (!dto.contractAccepted) {
      throw new BadRequestException('You must accept the loan contract agreement');
    }
    if (!collateralPhotoUrl) {
      throw new BadRequestException('Collateral photo is required');
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const productCode = LOAN_PRODUCT_CODE_BY_CATEGORY[dto.loanCategory];
    const product = await this.prisma.loanProduct.findUnique({ where: { code: productCode } });
    if (!product || !product.isActive) {
      throw new NotFoundException(`Loan product for ${dto.loanCategory} is not available`);
    }

    const amount = dto.principalAmount;
    if (amount < Number(product.minAmount) || amount > Number(product.maxAmount)) {
      throw new BadRequestException(
        `Amount must be between ${product.minAmount} and ${product.maxAmount}`,
      );
    }

    const quote = calculateTanjuielLoanQuote({
      principalAmount: amount,
      tenurePeriods: dto.tenurePeriods,
      repaymentPlan: dto.repaymentPlan,
    });

    if (quote.tenureMonths < product.minTenureMonths || quote.tenureMonths > product.maxTenureMonths) {
      throw new BadRequestException(
        `Duration is outside allowed range for this loan type (${product.minTenureMonths}–${product.maxTenureMonths} months equivalent)`,
      );
    }

    const dob = new Date(dto.applicantDateOfBirth);
    if (Number.isNaN(dob.getTime()) || dob >= new Date()) {
      throw new BadRequestException('Date of birth must be a valid date in the past');
    }

    const comment =
      source === 'MOBILE'
        ? 'Application submitted via customer mobile app'
        : 'Application submitted at branch (staff portal)';

    const loan = await this.prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          loanNumber: generateLoanNumber(),
          status: LoanStatus.SUBMITTED,
          principalAmount: amount,
          interestRate: product.interestRate,
          tenureMonths: quote.tenureMonths,
          monthlyPayment: quote.installmentAmount,
          totalRepayable: quote.totalRepayable,
          outstandingBalance: quote.totalRepayable,
          purpose: dto.purpose,
          collateral: dto.collateral,
          collateralType: dto.collateralType,
          collateralEstimatedValue: dto.collateralEstimatedValue,
          collateralPhotoUrl,
          guarantorName: dto.guarantorName,
          guarantorPhone: dto.guarantorPhone,
          applicantFullName: dto.applicantFullName.trim(),
          locationType: dto.locationType,
          applicantAddress: dto.applicantAddress.trim(),
          applicantGender: dto.applicantGender,
          applicantDateOfBirth: dob,
          educationLevel: dto.educationLevel,
          maritalStatus: dto.maritalStatus,
          businessActivities: dto.businessActivities,
          yearsOfExperience: dto.yearsOfExperience,
          unionName: dto.unionName?.trim() || null,
          nextOfKinName: dto.nextOfKinName.trim(),
          nextOfKinPhone: dto.nextOfKinPhone.trim(),
          nextOfKinAddress: dto.nextOfKinAddress.trim(),
          loanCategory: dto.loanCategory,
          repaymentPlan: dto.repaymentPlan,
          tenurePeriods: dto.tenurePeriods,
          openingFeeAmount: quote.openingFee,
          upfrontFeeAmount: quote.upfrontFee,
          flatInterestAmount: quote.flatInterestAmount,
          installmentAmount: quote.installmentAmount,
          contractAcceptedAt: new Date(),
          contractVersion: LOAN_CONTRACT_VERSION,
          customerId,
          productId: product.id,
          branchId: customer.branchId,
          submittedAt: new Date(),
        },
      });

      await tx.loanApproval.create({
        data: {
          loanId: newLoan.id,
          actorId,
          action: ApprovalAction.SUBMIT,
          comment,
        },
      });

      await tx.loanSchedule.createMany({
        data: quote.schedule.map((s) => ({ loanId: newLoan.id, ...s })),
      });

      return newLoan;
    });

    return loan;
  }
}
