import 'package:tanjuriel_microfinance/core/constants/contribution_frequency.dart';
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
    this.contributionFrequency,
  });

  final String id;
  final String accountNumber;
  final String type;
  final double balance;
  final double availableBalance;
  final String? label;
  final DateTime? maturityDate;
  final String? contributionFrequency;

  bool get isChildSavings => type == 'MY_PIKIN';
  bool get isMyPikin => isChildSavings;
  bool get isDailySavings => type == 'DAILY_SAVINGS';
  bool get canTransferOnMobile => type != 'MY_PIKIN';

  bool get canRequestWithdrawalOnMobile => isMyPikin && isMature;

  bool get isMature {
    if (!isMyPikin) return false;
    if (maturityDate == null) return false;
    final today = DateTime.now();
    final maturity = DateTime(maturityDate!.year, maturityDate!.month, maturityDate!.day);
    final now = DateTime(today.year, today.month, today.day);
    return !maturity.isAfter(now);
  }

  String get displayName {
    final typeLabel = switch (type) {
      'SAVINGS' => 'Savings',
      'DAILY_SAVINGS' => 'Daily Savings',
      'MY_PIKIN' => 'Child Savings',
      'CURRENT' => 'Current',
      'FIXED_DEPOSIT' => 'Fixed Deposit',
      _ => type.replaceAll('_', ' '),
    };
    if (label != null && label!.isNotEmpty) {
      return '$typeLabel · $label';
    }
    return typeLabel;
  }

  String? get frequencyLabel {
    if (contributionFrequency == null || contributionFrequency!.isEmpty) return null;
    return ContributionFrequency.label(contributionFrequency!);
  }

  String get mobileRulesSummary {
    final freq = frequencyLabel != null ? '$frequencyLabel · ' : '';
    if (isChildSavings) {
      if (maturityDate != null && !isMature) {
        return '${freq}Locked until ${maturityDate!.toLocal().toString().split(' ').first}. Request withdrawal on mobile after maturity.';
      }
      return '${freq}Mature — request withdrawal on mobile; manager approves, collect cash at branch';
    }
    if (isDailySavings) {
      return '${freq}Transfers require manager approval';
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
      contributionFrequency: json['contributionFrequency'] as String?,
    );
  }
}
