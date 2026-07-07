import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/account_number_formatter.dart';
import 'package:tanjuriel_microfinance/core/utils/mask_utils.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    child: Text(
                      user?.firstName.substring(0, 1).toUpperCase() ?? 'U',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user?.fullName ?? 'Customer', style: Theme.of(context).textTheme.titleLarge),
                        Text(user?.email ?? '', style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: 4),
                        Text(
                          MaskUtils.maskAccountNumber(user?.accountNumber ?? ''),
                          style: Theme.of(context).textTheme.labelMedium,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _SectionHeader(title: 'Account'),
          _ProfileTile(
            icon: Icons.verified_user_outlined,
            title: 'KYC Status',
            subtitle: user?.isKycComplete == true ? 'Verified' : 'Pending',
            onTap: () => context.push(RouteNames.kycStatus),
          ),
          _ProfileTile(
            icon: Icons.account_balance_wallet_outlined,
            title: 'Account Details',
            subtitle: user?.accountNumber == null || user!.accountNumber.isEmpty
                ? null
                : 'Member ID ${AccountNumberFormatter.display(user.accountNumber)}',
            onTap: () => context.push(RouteNames.accountDetails),
          ),
          const SizedBox(height: 16),
          _SectionHeader(title: 'Security'),
          _ProfileTile(
            icon: Icons.security_outlined,
            title: 'Security Settings',
            subtitle: 'Biometrics, PIN & password',
            onTap: () => context.push(RouteNames.securitySettings),
          ),
          _ProfileTile(
            icon: Icons.lock_outline,
            title: 'Change Password',
            onTap: () => context.push(RouteNames.changePassword),
          ),
          _ProfileTile(
            icon: Icons.pin_outlined,
            title: 'Change PIN',
            onTap: () => context.push(RouteNames.changePin),
          ),
          const SizedBox(height: 16),
          _SectionHeader(title: 'Support'),
          _ProfileTile(icon: Icons.help_outline, title: 'Help Center', onTap: () => context.push(RouteNames.helpCenter)),
          _ProfileTile(icon: Icons.description_outlined, title: 'Terms & Privacy', onTap: () => context.push(RouteNames.termsPrivacy)),
          const SizedBox(height: 24),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.error),
            title: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
            onTap: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go(RouteNames.welcome);
            },
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8, top: 8),
      child: Text(title, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.textMuted)),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title),
        subtitle: subtitle != null ? Text(subtitle!) : null,
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
