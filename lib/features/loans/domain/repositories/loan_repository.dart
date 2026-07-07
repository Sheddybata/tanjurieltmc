import 'package:tanjuriel_microfinance/shared/models/loan_model.dart';

abstract class LoanRepository {
  Future<List<LoanProductModel>> getProducts();
  Future<List<LoanModel>> getLoans();
  Future<LoanModel> getLoan(String id);
  Future<Map<String, dynamic>> quote({
    required double principalAmount,
    required int tenurePeriods,
    required String repaymentPlan,
  });
  Future<LoanModel> apply({
    required Map<String, dynamic> fields,
    required String pin,
    String? collateralPhotoPath,
  });
}
