import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/config/app_config.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/utils/greeting_util.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/widgets/kyc_pending_banner.dart';
import 'package:tanjuriel_microfinance/core/widgets/masked_balance_card.dart';
import 'package:tanjuriel_microfinance/core/widgets/quick_action_grid.dart';
import 'package:tanjuriel_microfinance/core/widgets/transaction_tile.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  AccountBalance? _balance;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    await ref.read(authProvider.notifier).refreshProfile();
    final balance = await ref.read(accountRepositoryProvider).getBalance();
    if (mounted) {
      setState(() {
        _balance = balance;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final isVisible = ref.watch(balanceVisibilityProvider);
    final greeting = GreetingUtil.forNow();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push(RouteNames.notifications),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Row(
                    children: [
                      Icon(greeting.icon, color: Theme.of(context).colorScheme.primary, size: 22),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${greeting.greeting}, ${user?.firstName ?? 'Customer'}',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (AppConfig.useMockApi)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade100,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange.shade300),
                      ),
                      child: Text(
                        'Demo mode — balances are fake. Stop app and run scripts/run-mobile-live.ps1 for real data.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.orange.shade900),
                      ),
                    ),
                  const KycPendingBanner(),
                  MaskedBalanceCard(
                    balance: _balance?.available ?? 0,
                    isVisible: isVisible,
                    onToggleVisibility: () {
                      ref.read(balanceVisibilityProvider.notifier).state = !isVisible;
                    },
                    accountNumber: user?.accountNumber,
                    accountName: user?.fullName,
                  ),
                  const SizedBox(height: 24),
                  Text('Quick Actions', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  QuickActionGrid(
                    actions: [
                      QuickAction(
                        label: 'Fund',
                        icon: Icons.add_card_rounded,
                        onTap: () {
                          if (KycGuard.requireVerified(context, user)) {
                            context.push(RouteNames.fundAccount);
                          }
                        },
                      ),
                      QuickAction(
                        label: 'Loans',
                        icon: Icons.account_balance_outlined,
                        onTap: () {
                          if (KycGuard.requireVerified(context, user)) {
                            context.push(RouteNames.loans);
                          }
                        },
                      ),
                      QuickAction(
                        label: 'Transfer',
                        icon: Icons.swap_horiz_rounded,
                        onTap: () {
                          if (KycGuard.requireVerified(context, user)) {
                            context.go(RouteNames.transfer);
                          }
                        },
                      ),
                      QuickAction(
                        label: 'History',
                        icon: Icons.history_rounded,
                        onTap: () => context.go(RouteNames.transactions),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Recent Transactions', style: Theme.of(context).textTheme.titleMedium),
                      TextButton(
                        onPressed: () => context.go(RouteNames.transactions),
                        child: const Text('See all'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  FutureBuilder(
                    future: ref.read(transactionRepositoryProvider).getTransactions(limit: 5),
                    builder: (context, snapshot) {
                      if (!snapshot.hasData) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      final txns = snapshot.data!;
                      if (txns.isEmpty) {
                        return const Center(child: Text('No transactions yet'));
                      }
                      return Column(
                        children: txns
                            .map(
                              (t) => TransactionTile(
                                transaction: t,
                                onTap: () => context.push('/transactions/${t.id}'),
                              ),
                            )
                            .toList(),
                      );
                    },
                  ),
                ],
              ),
      ),
    );
  }
}
