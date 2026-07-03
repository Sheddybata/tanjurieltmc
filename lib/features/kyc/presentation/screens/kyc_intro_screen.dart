import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';

class KycIntroScreen extends StatelessWidget {
  const KycIntroScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final steps = [
      _KycStep(Icons.badge_outlined, 'BVN Verification', 'Verify your identity with your Bank Verification Number'),
      _KycStep(Icons.fingerprint_outlined, 'NIN Verification', 'Confirm identity with National Identification Number'),
      _KycStep(Icons.face_retouching_natural_outlined, 'Face Capture', 'Take a selfie for liveness check'),
      _KycStep(Icons.verified_user_outlined, 'Review', 'We review and activate your account'),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Identity Verification')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Complete your KYC', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              'Regulatory compliance requires identity verification before you can transact.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 32),
            ...steps.map((step) => _StepTile(step: step)),
            const Spacer(),
            AppButton(
              label: 'Start Verification',
              onPressed: () => context.push(RouteNames.bvnVerification),
            ),
            const SizedBox(height: 12),
            AppButton(
              label: 'Skip for now',
              variant: AppButtonVariant.outline,
              onPressed: () => context.go(RouteNames.home),
            ),
          ],
        ),
      ),
    );
  }
}

class _KycStep {
  const _KycStep(this.icon, this.title, this.subtitle);
  final IconData icon;
  final String title;
  final String subtitle;
}

class _StepTile extends StatelessWidget {
  const _StepTile({required this.step});
  final _KycStep step;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(step.icon, color: AppColors.primary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(step.title, style: Theme.of(context).textTheme.titleSmall),
                Text(step.subtitle, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
