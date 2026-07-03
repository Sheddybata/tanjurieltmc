import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/core/utils/json_utils.dart';
import 'package:tanjuriel_microfinance/features/transactions/domain/repositories/transaction_repository.dart';
import 'package:tanjuriel_microfinance/shared/models/transaction_model.dart';

class TransactionRepositoryImpl implements TransactionRepository {
  TransactionRepositoryImpl(this._api);

  final ApiClient _api;

  @override
  Future<List<TransactionModel>> getTransactions({int page = 1, int limit = 20}) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/customer/transactions',
      queryParameters: {'page': page, 'limit': limit},
    );

    final data = (response.data?['data'] as List<dynamic>?) ?? [];
    return data.map((item) => _mapTransaction(item as Map<String, dynamic>)).toList();
  }

  @override
  Future<TransactionModel> getTransactionById(String id) async {
    final list = await getTransactions(limit: 100);
    return list.firstWhere((t) => t.id == id || t.reference == id);
  }

  TransactionModel _mapTransaction(Map<String, dynamic> json) {
    final type = json['type'] as String? ?? 'DEPOSIT';
    final isCredit = type == 'DEPOSIT' || type == 'LOAN_DISBURSEMENT';
    final status = json['status'] as String? ?? 'COMPLETED';

    return TransactionModel(
      id: json['id'] as String,
      reference: json['reference'] as String,
      narration: json['narration'] as String? ?? type,
      amount: JsonUtils.parseDouble(json['amount']),
      type: isCredit ? TransactionType.credit : TransactionType.debit,
      category: _categoryForType(type),
      status: status == 'PENDING'
          ? TransactionStatus.pending
          : status == 'FAILED'
              ? TransactionStatus.failed
              : TransactionStatus.success,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  TransactionCategory _categoryForType(String type) {
    switch (type) {
      case 'DEPOSIT':
        return TransactionCategory.deposit;
      case 'WITHDRAWAL':
        return TransactionCategory.withdrawal;
      case 'TRANSFER':
        return TransactionCategory.transfer;
      case 'LOAN_DISBURSEMENT':
      case 'LOAN_REPAYMENT':
        return TransactionCategory.deposit;
      default:
        return TransactionCategory.transfer;
    }
  }
}
