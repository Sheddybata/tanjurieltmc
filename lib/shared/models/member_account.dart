import 'package:tanjuriel_microfinance/core/utils/json_utils.dart';

class MemberAccount {
  const MemberAccount({
    required this.id,
    required this.accountNumber,
    required this.type,
    required this.balance,
    required this.availableBalance,
    this.label,
    this.maturityDate,
  });

  final String id;
  final String accountNumber;
  final String type;
  final double balance;
  final double availableBalance;
  final String? label;
  final DateTime? maturityDate;

  bool get isMyPikin => type == 'MY_PIKIN';
  bool get isDailySavings => type == 'DAILY_SAVINGS';
  bool get canTransferOnMobile => type != 'MY_PIKIN';

  bool get canRequestWithdrawalOnMobile => isMyPikin && isMature;

  bool get isMature {
    if (!isMyPikin || maturityDate == null) return true;
    return !maturityDate!.isAfter(DateTime.now());
  }

  String get displayName {
    final typeLabel = switch (type) {
      'SAVINGS' => 'Savings',
      'DAILY_SAVINGS' => 'Daily Savings',
      'MY_PIKIN' => 'My Pikin',
      'CURRENT' => 'Current',
      'FIXED_DEPOSIT' => 'Fixed Deposit',
      _ => type.replaceAll('_', ' '),
    };
    if (label != null && label!.isNotEmpty) {
      return '$typeLabel · $label';
    }
    return typeLabel;
  }

  String get mobileRulesSummary {
    if (isMyPikin) {
      if (maturityDate != null && !isMature) {
        return 'Locked until ${maturityDate!.toLocal().toString().split(' ').first}. You can request withdrawal on mobile after maturity.';
      }
      return 'Mature — request withdrawal on mobile; manager approves, collect cash at branch';
    }
    if (isDailySavings) {
      return 'Transfers require manager approval';
    }
    return 'Standard savings account';
  }

  factory MemberAccount.fromJson(Map<String, dynamic> json) {
    DateTime? maturity;
    final rawMaturity = json['maturityDate'];
    if (rawMaturity is String && rawMaturity.isNotEmpty) {
      maturity = DateTime.tryParse(rawMaturity);
    }

    return MemberAccount(
      id: json['id'] as String,
      accountNumber: JsonUtils.parseString(json['accountNumber']),
      type: json['type'] as String? ?? 'SAVINGS',
      balance: JsonUtils.parseDouble(json['balance']),
      availableBalance: JsonUtils.parseDouble(json['availableBalance'], fallback: JsonUtils.parseDouble(json['balance'])),
      label: json['label'] as String?,
      maturityDate: maturity,
    );
  }
}
