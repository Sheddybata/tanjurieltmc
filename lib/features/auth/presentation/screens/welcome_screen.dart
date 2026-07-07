import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

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
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Icon(Icons.account_balance, color: AppColors.primary, size: 40),
              ),
              const SizedBox(height: 32),
              Text(
                'Welcome to\n${AppConstants.appName}',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 12),
              Text(
                'Manage your account, fund your wallet, and request transfers from your phone.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'New customer?',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Register in the app with your BVN and NIN. All new accounts are assigned to Head Office – Jos. Visit the branch if teller verification is needed to unlock banking features.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(height: 1.4),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              AppButton(
                label: 'Sign In',
                onPressed: () => context.push(RouteNames.login),
              ),
              const SizedBox(height: 12),
              AppButton(
                label: 'Create account',
                variant: AppButtonVariant.outline,
                onPressed: () => context.push(RouteNames.register),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
