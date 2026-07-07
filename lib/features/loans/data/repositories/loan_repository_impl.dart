import 'dart:convert';

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
  Future<Map<String, dynamic>> quote({
    required double principalAmount,
    required int tenurePeriods,
    required String repaymentPlan,
  }) async {
    final response = await _api.post<Map<String, dynamic>>('/customer/loans/quote', data: {
      'principalAmount': principalAmount,
      'tenurePeriods': tenurePeriods,
      'repaymentPlan': repaymentPlan,
    });
    return Map<String, dynamic>.from(response.data?['data'] as Map? ?? {});
  }

  @override
  Future<LoanModel> apply({
    required Map<String, dynamic> fields,
    required String pin,
    String? collateralPhotoPath,
  }) async {
    final form = FormData.fromMap({
      ...fields.map((key, value) {
        if (key == 'businessActivities' && value is List) {
          return MapEntry(key, jsonEncode(value));
        }
        return MapEntry(key, value as Object);
      }),
      'pin': pin,
      'contractAccepted': 'true',
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
