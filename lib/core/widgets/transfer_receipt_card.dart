import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/receipt_share_util.dart';

class TransferReceiptCard extends StatelessWidget {
  const TransferReceiptCard({super.key, required this.data});

  final ReceiptData data;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Text(
                AppConstants.appName,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
            const SizedBox(height: 4),
            Center(
              child: Text(data.title, style: Theme.of(context).textTheme.bodySmall),
            ),
            const Divider(height: 32),
            ...data.rows.map(
              (row) => _ReceiptRow(
                label: row.$1,
                value: row.$2,
                highlight: row.$1 == 'Amount',
              ),
            ),
            if (data.isPending) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Pending manager approval',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.warning),
                ),
              ),
            ],
            const SizedBox(height: 8),
            Center(
              child: Text(
                DateFormat('dd MMM yyyy, HH:mm').format(data.dateTime),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  const _ReceiptRow({required this.label, required this.value, this.highlight = false});

  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: Theme.of(context).textTheme.bodySmall),
          ),
          Expanded(
            child: Text(
              value,
              style: highlight
                  ? Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.primary)
                  : Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
