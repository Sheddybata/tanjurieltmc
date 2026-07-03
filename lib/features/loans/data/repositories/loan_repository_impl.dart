import 'package:dio/dio.dart';
import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/features/loans/domain/repositories/loan_repository.dart';
import 'package:tanjuriel_microfinance/shared/models/loan_model.dart';

class LoanRepositoryImpl implements LoanRepository {
  LoanRepositoryImpl(this._api);

  final ApiClient _api;

  @override
  Future<List<LoanProductModel>> getProducts() async {
    final response = await _api.get<Map<String, dynamic>>('/customer/loan-products');
    final data = (response.data?['data'] as List<dynamic>?) ?? [];
    return data.map((e) => LoanProductModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<List<LoanModel>> getLoans() async {
    final response = await _api.get<Map<String, dynamic>>('/customer/loans');
    final data = (response.data?['data'] as List<dynamic>?) ?? [];
    return data.map((e) => LoanModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Future<LoanModel> getLoan(String id) async {
    final response = await _api.get<Map<String, dynamic>>('/customer/loans/$id');
    final body = response.data;
    if (body?['success'] != true) {
      throw Exception(body?['message'] ?? 'Unable to load loan');
    }
    return LoanModel.fromJson(body!['data'] as Map<String, dynamic>);
  }

  @override
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
  }) async {
    final form = FormData.fromMap({
      'productId': productId,
      'principalAmount': principalAmount,
      'tenureMonths': tenureMonths,
      if (purpose != null && purpose.isNotEmpty) 'purpose': purpose,
      'pin': pin,
      if (collateral != null) 'collateral': collateral,
      if (collateralType != null) 'collateralType': collateralType,
      if (collateralEstimatedValue != null) 'collateralEstimatedValue': collateralEstimatedValue,
      if (guarantorName != null) 'guarantorName': guarantorName,
      if (guarantorPhone != null) 'guarantorPhone': guarantorPhone,
    });

    if (collateralPhotoPath != null) {
      form.files.add(MapEntry(
        'collateralPhoto',
        await MultipartFile.fromFile(collateralPhotoPath, filename: 'collateral.jpg'),
      ));
    }

    final response = await _api.post<Map<String, dynamic>>(
      '/customer/loans/apply',
      data: form,
    );

    final body = response.data;
    if (body?['success'] != true) {
      throw Exception(body?['message'] ?? 'Application failed');
    }
    return LoanModel.fromJson(body!['data'] as Map<String, dynamic>);
  }
}
