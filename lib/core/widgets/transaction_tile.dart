import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/shared/models/transaction_model.dart';

class TransactionTile extends StatelessWidget {
  const TransactionTile({
    super.key,
    required this.transaction,
    this.onTap,
  });

  final TransactionModel transaction;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isCredit = transaction.type == TransactionType.credit;
    final color = isCredit ? AppColors.credit : AppColors.debit;
    final prefix = isCredit ? '+' : '-';

    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(
          _iconForCategory(transaction.category),
          color: color,
          size: 22,
        ),
      ),
      title: Text(
        transaction.narration,
        style: Theme.of(context).textTheme.titleSmall,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        DateFormat('dd MMM yyyy • HH:mm').format(transaction.createdAt),
        style: Theme.of(context).textTheme.bodySmall,
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            '$prefix${CurrencyFormatter.format(transaction.amount)}',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
          ),
          Text(
            transaction.status.label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: transaction.status == TransactionStatus.success
                      ? AppColors.success
                      : AppColors.warning,
                ),
          ),
        ],
      ),
    );
  }

  IconData _iconForCategory(TransactionCategory category) {
    return switch (category) {
      TransactionCategory.transfer => Icons.swap_horiz_rounded,
      TransactionCategory.billPayment => Icons.receipt_long_rounded,
      TransactionCategory.airtime => Icons.phone_android_rounded,
      TransactionCategory.data => Icons.wifi_rounded,
      TransactionCategory.utility => Icons.bolt_rounded,
      TransactionCategory.deposit => Icons.arrow_downward_rounded,
      TransactionCategory.withdrawal => Icons.arrow_upward_rounded,
    };
  }
}
