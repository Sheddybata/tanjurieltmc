import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/providers/member_accounts_provider.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';
import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/core/utils/child_savings_statement_util.dart';

class SavingsScreen extends ConsumerStatefulWidget {
  const SavingsScreen({super.key});

  @override
  ConsumerState<SavingsScreen> createState() => _SavingsScreenState();
}

class _SavingsScreenState extends ConsumerState<SavingsScreen> {
  bool _refreshing = false;

  Future<void> _refresh() async {
    setState(() => _refreshing = true);
    try {
      final data = await ref.read(accountRepositoryProvider).getDashboardData(forceRefresh: true);
      setMemberAccounts(ref, data.accounts, prefer: ref.read(selectedAccountProvider));
    } finally {
      if (mounted) setState(() => _refreshing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final accounts = ref.watch(memberAccountsProvider);
    final user = ref.watch(authProvider).user;
    final hasDaily = accounts.any((a) => a.type == 'DAILY_SAVINGS');
    final canOpenDaily = !hasDaily;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Savings'),
        actions: [
          TextButton(
            onPressed: () {
              if (KycGuard.requireVerified(context, user)) {
                context.push(RouteNames.openAccount);
              }
            },
            child: Text(canOpenDaily ? 'Open account' : 'Open Child Savings'),
          ),
        ],
      ),
      body: accounts.isEmpty
          ? RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(
                    height: MediaQuery.sizeOf(context).height * 0.4,
                    child: Center(
                      child: _refreshing
                          ? const CircularProgressIndicator()
                          : Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('No accounts yet'),
                                const SizedBox(height: 16),
                                AppButton(
                                  label: canOpenDaily ? 'Open Daily Savings or Child Savings' : 'Open Child Savings',
                                  onPressed: () {
                                    if (KycGuard.requireVerified(context, user)) {
                                      context.push(RouteNames.openAccount);
                                    }
                                  },
                                ),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _refresh,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
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
                                  color: account.isChildSavings ? Colors.amber.shade800 : Colors.grey.shade700,
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
                              if (account.isChildSavings)
                                AppButton(
                                  label: 'Download statement',
                                  variant: AppButtonVariant.secondary,
                                  onPressed: () {
                                    ChildSavingsStatementUtil.downloadAndShare(
                                      context,
                                      ref.read(apiClientProvider),
                                      account,
                                    );
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
            ),
    );
  }
}
