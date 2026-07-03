import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

class KycPendingBanner extends ConsumerWidget {
  const KycPendingBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    if (user == null || user.isKycComplete) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Verification pending',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            'You can browse the app, but funding, transfers, and loans unlock after teller approval.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          TextButton(
            onPressed: () => context.push(RouteNames.kycIntro),
            child: const Text('View verification status'),
          ),
        ],
      ),
    );
  }
}

bool isKycVerifiedFromApi(String? status) => status == 'VERIFIED';

KycStatus mapApiKycStatus(String? status) {
  return switch (status) {
    'VERIFIED' => KycStatus.approved,
    'REJECTED' => KycStatus.rejected,
    'PENDING' => KycStatus.underReview,
    _ => KycStatus.notStarted,
  };
}
