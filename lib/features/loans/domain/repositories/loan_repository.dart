import 'package:tanjuriel_microfinance/shared/models/loan_model.dart';

abstract class LoanRepository {
  Future<List<LoanProductModel>> getProducts();
  Future<List<LoanModel>> getLoans();
  Future<LoanModel> getLoan(String id);
  Future<LoanModel> apply({
    required String productId,
    required double principalAmount,
    required int tenureMonths,
    String? purpose,
    required String pin,
    String? collateral,
    String? collateralType,
    double? collateralEstimatedValue,
    String? guarantorName,
    String? guarantorPhone,
    String? collateralPhotoPath,
  });
}
