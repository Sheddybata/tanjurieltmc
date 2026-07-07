import 'package:tanjuriel_microfinance/core/constants/loan_application_options.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';

String buildLoanContractText({
  required String memberName,
  required double principalAmount,
  required double installmentAmount,
  required String repaymentPlan,
  required int tenurePeriods,
  DateTime? signedAt,
}) {
  final today = signedAt ?? DateTime.now();
  final dateStr = '${today.day} ${_monthName(today.month)} ${today.year}';
  final unit = LoanApplicationOptions.repaymentPeriodUnit(repaymentPlan);
  final unitSingular = unit.substring(0, unit.length - 1);

  return '''CONTACT AGREEMENT

This agreement is made between Tanjuriel Microcredit Limited of Jos City (hereinafter Tanjuriel MCL) of the first Part on $dateStr and $memberName (hereinafter "the Client") of the second Part.

Tanjuriel Microcredit Limited is a regulated micro-finance institution whose principal objective is to assist its clients break out of the grip of poverty, through access to flexible financial/social services.

The client is desirous of becoming a member of and obtaining a loan from Tanjuriel Microcredit Limited in the amount of ${CurrencyFormatter.format(principalAmount)} (as selected during sign-up) in $tenurePeriods installment(s) of ${CurrencyFormatter.format(installmentAmount)} per $unitSingular.

THE PARTIES HAVE AGREED as follows:

1. The Client will repay the loan and the interest in $tenurePeriods installment(s).

2. Ownership of all assets acquired by the loan will belong to Tanjuriel Microcredit Limited until the loan is fully repaid. The Client will not transfer these assets to any person while this agreement lasts.

3. The Client shall obey all rules and regulations in connection with the loan provided by Tanjuriel Microcredit Limited as well as to repay the loan fully under all circumstances.

4. The guarantors hereby give an undertaking that the client shall repay the loan and agree to pay off the loan from their group savings where there is default(s).

AS WITNESS the hands of the parties the day and year first above written. Tanjuriel Microcredit Limited reserves the right in the event of default to approach and recover the outstanding principal and accrued interest from the borrower and guarantors/group members at their place of abode and business place. The bank is entitled to right of set-off, using client savings as stated in clause 3 in the declaration section of the account opening booklet.

5. The Borrower consents that account information can be used for publication and also shared with relevant stakeholders to this contract by the bank; such stakeholders include Regulatory authorities, Credit Bureau, Guarantor and Spouse or any family member who has offered to pay-off any outstanding balance in cases of default.

6. In line with CBN Guidelines: "By signing this loan agreement form and by drawing on the loan, I covenant to repay the loan as and when due. In the event that I fail to repay the loan as agreed, and the loan becomes delinquent, the bank has the right to report the delinquent loan to the CBN through the Credit Risk Management System (CRMS) or by any other means."

7. I covenant and warrant that the bank shall have power to set-off my indebtedness under this loan agreement from all such monies and funds standing to my credit/benefit in any and all such accounts or from any other financial assets belonging to me and in the custody of any such bank. Such action could include seizing and auctioning of the Borrower's personal assets and savings balance after seven (7) days of client default on any of the weekly/monthly repayments (where applicable).

8. The client reserves the right to cancel and return the loan if he/she no longer has need for it and wishes to return it. However the client shall be required to pay whatever interest has accrued for the period the loan was with him/her.

9. The loan shall not be used for any of the businesses/activities listed in the MFB Enterprise Financing Exclusion List.''';
}

String _monthName(int month) {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return names[month - 1];
}
