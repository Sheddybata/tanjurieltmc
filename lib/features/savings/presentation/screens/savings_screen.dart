import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/providers/member_accounts_provider.dart';

class SavingsScreen extends ConsumerWidget {
  const SavingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accounts = ref.watch(memberAccountsProvider);
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Savings'),
      ),
      body: accounts.isEmpty
          ? const Center(child: Text('No accounts yet'))
          : ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: accounts.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final account = accounts[index];
                final isSelected = ref.watch(selectedAccountProvider)?.id == account.id;

                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                account.displayName,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                            ),
                            if (isSelected)
                              const Chip(
                                label: Text('Active'),
                                visualDensity: VisualDensity.compact,
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          account.accountNumber,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                fontFamily: 'monospace',
                              ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          CurrencyFormatter.format(account.availableBalance),
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          account.mobileRulesSummary,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: account.isMyPikin ? Colors.amber.shade800 : Colors.grey.shade700,
                              ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            if (account.canTransferOnMobile)
                              AppButton(
                                label: 'Fund account',
                                onPressed: () {
                                  ref.read(selectedAccountProvider.notifier).state = account;
                                  if (KycGuard.requireVerified(context, user)) {
                                    context.push(RouteNames.fundAccount);
                                  }
                                },
                              ),
                            if (account.canRequestWithdrawalOnMobile)
                              AppButton(
                                label: 'Request withdrawal',
                                variant: AppButtonVariant.secondary,
                                onPressed: () {
                                  ref.read(selectedAccountProvider.notifier).state = account;
                                  if (KycGuard.requireVerified(context, user)) {
                                    context.push(RouteNames.requestWithdrawal, extra: account);
                                  }
                                },
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
