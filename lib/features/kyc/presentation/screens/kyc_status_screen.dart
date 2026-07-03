import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

class KycStatusScreen extends ConsumerWidget {
  const KycStatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final isApproved = user?.isKycComplete == true;
    final isRejected = user?.kycStatus == KycStatus.rejected;

    final title = isApproved
        ? 'KYC Verified'
        : isRejected
            ? 'KYC Rejected'
            : 'KYC Under Review';

    final subtitle = isApproved
        ? 'Your identity has been verified. You can use all app features.'
        : isRejected
            ? 'Your verification was rejected. Please visit a Tanjuriel branch for assistance.'
            : 'Your documents are being reviewed. We typically complete verification within 24 hours.';

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
                  color: (isApproved ? AppColors.success : AppColors.warning).withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isApproved ? Icons.verified : Icons.hourglass_top,
                  color: isApproved ? AppColors.success : AppColors.warning,
                  size: 48,
                ),
              ),
              const SizedBox(height: 32),
              Text(title, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              _StatusItem(
                label: 'BVN',
                status: user?.bvnVerified == true ? 'Verified' : 'Pending',
              ),
              _StatusItem(
                label: 'NIN',
                status: user?.ninVerified == true ? 'Verified' : 'Pending',
              ),
              _StatusItem(
                label: 'Face Capture',
                status: user?.bvnVerified == true && user?.ninVerified == true ? 'Submitted' : 'Pending',
              ),
              _StatusItem(
                label: 'Account Activation',
                status: isApproved ? 'Verified' : 'Pending',
              ),
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
    final isVerified = status == 'Verified' || status == 'Submitted';
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
