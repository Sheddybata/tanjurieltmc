enum TransactionType { credit, debit }

enum TransactionCategory {
  transfer,
  billPayment,
  airtime,
  data,
  utility,
  deposit,
  withdrawal,
}

enum TransactionStatus {
  pending('Pending'),
  success('Successful'),
  failed('Failed'),
  reversed('Reversed');

  const TransactionStatus(this.label);
  final String label;
}

class TransactionModel {
  const TransactionModel({
    required this.id,
    required this.reference,
    required this.narration,
    required this.amount,
    required this.type,
    required this.category,
    required this.status,
    required this.createdAt,
    this.fee = 0,
    this.recipientName,
    this.recipientAccount,
    this.recipientBank,
    this.sessionId,
    this.balanceAfter,
  });

  final String id;
  final String reference;
  final String narration;
  final double amount;
  final double fee;
  final TransactionType type;
  final TransactionCategory category;
  final TransactionStatus status;
  final DateTime createdAt;
  final String? recipientName;
  final String? recipientAccount;
  final String? recipientBank;
  final String? sessionId;
  final double? balanceAfter;

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as String,
      reference: json['reference'] as String,
      narration: json['narration'] as String,
      amount: (json['amount'] as num).toDouble(),
      fee: (json['fee'] as num?)?.toDouble() ?? 0,
      type: TransactionType.values.byName(json['type'] as String),
      category: TransactionCategory.values.byName(json['category'] as String),
      status: TransactionStatus.values.byName(json['status'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
      recipientName: json['recipient_name'] as String?,
      recipientAccount: json['recipient_account'] as String?,
      recipientBank: json['recipient_bank'] as String?,
      sessionId: json['session_id'] as String?,
      balanceAfter: (json['balance_after'] as num?)?.toDouble(),
    );
  }
}
