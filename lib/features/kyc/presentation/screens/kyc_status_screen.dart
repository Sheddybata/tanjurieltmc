import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';

class KycStatusScreen extends StatelessWidget {
  const KycStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.hourglass_top, color: AppColors.warning, size: 48),
              ),
              const SizedBox(height: 32),
              Text('KYC Under Review', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              Text(
                'Your identity documents have been submitted. We typically complete verification within 24 hours.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const _StatusItem(label: 'BVN', status: 'Verified'),
              const _StatusItem(label: 'NIN', status: 'Verified'),
              const _StatusItem(label: 'Face Capture', status: 'Submitted'),
              const _StatusItem(label: 'Account Activation', status: 'Pending'),
              const SizedBox(height: 40),
              AppButton(
                label: 'Go to Dashboard',
                onPressed: () => context.go(RouteNames.home),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusItem extends StatelessWidget {
  const _StatusItem({required this.label, required this.status});
  final String label;
  final String status;

  @override
  Widget build(BuildContext context) {
    final isVerified = status == 'Verified';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Row(
            children: [
              Icon(
                isVerified ? Icons.check_circle : Icons.pending,
                size: 16,
                color: isVerified ? AppColors.success : AppColors.warning,
              ),
              const SizedBox(width: 6),
              Text(status, style: Theme.of(context).textTheme.labelMedium),
            ],
          ),
        ],
      ),
    );
  }
}
