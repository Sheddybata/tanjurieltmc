import 'package:tanjuriel_microfinance/shared/models/transaction_model.dart';

abstract class TransactionRepository {
  Future<List<TransactionModel>> getTransactions({int page = 1, int limit = 20});
  Future<TransactionModel> getTransactionById(String id);
}
