import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/shared/models/loan_model.dart';

class LoanSubmittedScreen extends StatelessWidget {
  const LoanSubmittedScreen({super.key, required this.loan});

  final LoanModel loan;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Center(
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle, color: AppColors.success, size: 56),
                ),
              ),
              const SizedBox(height: 32),
              Center(
                child: Text(
                  'Application submitted',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  '${CurrencyFormatter.format(loan.principalAmount)} · ${loan.productName}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.primary),
                ),
              ),
              const SizedBox(height: 32),
              Text('What happens next', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              const _Step(number: '1', text: 'A manager reviews your collateral and guarantor details.'),
              const _Step(number: '2', text: 'You will receive a notification when your loan is approved or rejected.'),
              const _Step(number: '3', text: 'Visit our Jos branch if we need additional documents.'),
              const Spacer(),
              AppButton(
                label: 'View application',
                variant: AppButtonVariant.outline,
                onPressed: () => context.push('/loans/${loan.id}'),
              ),
              const SizedBox(height: 12),
              AppButton(
                label: 'Back to loans',
                onPressed: () => context.go(RouteNames.loans),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.number, required this.text});

  final String number;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: AppColors.primary.withValues(alpha: 0.12),
            child: Text(
              number,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.primary),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
        ],
      ),
    );
  }
}
