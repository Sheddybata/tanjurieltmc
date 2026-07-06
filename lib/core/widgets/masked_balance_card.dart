import 'package:flutter/material.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/core/utils/mask_utils.dart';

class MaskedBalanceCard extends StatelessWidget {
  const MaskedBalanceCard({
    super.key,
    required this.balance,
    required this.isVisible,
    required this.onToggleVisibility,
    this.accountNumber,
    this.accountName,
    this.trailing,
  });

  final double balance;
  final bool isVisible;
  final VoidCallback onToggleVisibility;
  final String? accountNumber;
  final String? accountName;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final displayBalance = isVisible
        ? CurrencyFormatter.format(balance)
        : MaskUtils.maskBalance(CurrencyFormatter.format(balance));

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(color: AppColors.shadow, blurRadius: 16, offset: Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Available Balance',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.85),
                    ),
              ),
              IconButton(
                onPressed: onToggleVisibility,
                icon: Icon(
                  isVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            displayBalance,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
          ),
          if (accountName != null || accountNumber != null) ...[
            const SizedBox(height: 8),
            const Divider(color: Colors.white24, height: 1),
            const SizedBox(height: 6),
            if (accountName != null)
              Text(
                accountName!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white),
              ),
            if (trailing != null) ...[
              const SizedBox(height: 4),
              trailing!,
            ],
            if (accountNumber != null) ...[
              const SizedBox(height: 2),
              Text(
                isVisible ? accountNumber! : MaskUtils.maskAccountNumber(accountNumber!),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.75),
                    ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}
