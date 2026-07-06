class BankModel {
  const BankModel({
    required this.code,
    required this.name,
    required this.nibssCode,
  });

  final String code;
  final String name;
  final String nibssCode;

  factory BankModel.fromJson(Map<String, dynamic> json) {
    final nibss = (json['nibssCode'] ?? json['nibss_code'] ?? json['code']) as String;
    return BankModel(
      code: nibss,
      name: json['name'] as String,
      nibssCode: nibss,
    );
  }
}

class NameEnquiryResult {
  const NameEnquiryResult({
    required this.accountNumber,
    required this.accountName,
    required this.bankCode,
    required this.sessionId,
    required this.responseCode,
    this.responseMessage,
  });

  final String accountNumber;
  final String accountName;
  final String bankCode;
  final String sessionId;
  final String responseCode;
  final String? responseMessage;

  bool get isSuccess => responseCode == '00';

  factory NameEnquiryResult.fromJson(Map<String, dynamic> json) {
    return NameEnquiryResult(
      accountNumber: json['account_number'] as String,
      accountName: json['account_name'] as String,
      bankCode: json['bank_code'] as String,
      sessionId: json['session_id'] as String,
      responseCode: json['response_code'] as String,
      responseMessage: json['response_message'] as String?,
    );
  }
}

class TransferRequest {
  const TransferRequest({
    required this.destinationBankCode,
    required this.destinationAccountNumber,
    required this.amount,
    required this.narration,
    required this.sessionId,
    required this.pin,
    this.accountId,
    this.beneficiaryName,
    this.beneficiaryBankName,
  });

  final String destinationBankCode;
  final String destinationAccountNumber;
  final double amount;
  final String narration;
  final String sessionId;
  final String pin;
  final String? accountId;
  final String? beneficiaryName;
  final String? beneficiaryBankName;

  Map<String, dynamic> toJson() => {
        'destination_bank_code': destinationBankCode,
        'destination_account_number': destinationAccountNumber,
        'amount': amount,
        'narration': narration,
        'session_id': sessionId,
        'pin': pin,
        if (beneficiaryName != null) 'beneficiary_name': beneficiaryName,
      };
}

class TransferResult {
  const TransferResult({
    required this.reference,
    required this.sessionId,
    required this.responseCode,
    required this.responseMessage,
    required this.amount,
    required this.fee,
    required this.status,
    this.beneficiaryName,
    this.beneficiaryAccount,
    this.beneficiaryBank,
    this.narration,
    this.createdAt,
  });

  final String reference;
  final String sessionId;
  final String responseCode;
  final String responseMessage;
  final double amount;
  final double fee;
  final String status;
  final String? beneficiaryName;
  final String? beneficiaryAccount;
  final String? beneficiaryBank;
  final String? narration;
  final DateTime? createdAt;

  bool get isSuccess => responseCode == '00';
  bool get isPending => status == 'pending';

  TransferResult withBeneficiaryDetails({
    required String beneficiaryName,
    required String beneficiaryAccount,
    required String beneficiaryBank,
    String? narration,
  }) {
    return TransferResult(
      reference: reference,
      sessionId: sessionId,
      responseCode: responseCode,
      responseMessage: responseMessage,
      amount: amount,
      fee: fee,
      status: status,
      beneficiaryName: beneficiaryName,
      beneficiaryAccount: beneficiaryAccount,
      beneficiaryBank: beneficiaryBank,
      narration: narration,
      createdAt: createdAt ?? DateTime.now(),
    );
  }

  factory TransferResult.fromJson(Map<String, dynamic> json) {
    return TransferResult(
      reference: json['reference'] as String,
      sessionId: json['session_id'] as String,
      responseCode: json['response_code'] as String,
      responseMessage: json['response_message'] as String,
      amount: (json['amount'] as num).toDouble(),
      fee: (json['fee'] as num?)?.toDouble() ?? 0,
      status: json['status'] as String,
      beneficiaryName: json['beneficiary_name'] as String?,
      beneficiaryAccount: json['beneficiary_account'] as String?,
      beneficiaryBank: json['beneficiary_bank'] as String?,
      narration: json['narration'] as String?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : null,
    );
  }
}
