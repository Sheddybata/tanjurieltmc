import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/models/loan_model.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class LoansScreen extends ConsumerStatefulWidget {
  const LoansScreen({super.key});

  @override
  ConsumerState<LoansScreen> createState() => _LoansScreenState();
}

class _LoansScreenState extends ConsumerState<LoansScreen> {
  List<LoanModel> _loans = [];
  bool _loading = true;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final loans = await ref.read(loanRepositoryProvider).getLoans();
      if (mounted) {
        setState(() {
          _loans = loans;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<LoanModel> get _filtered {
    return switch (_filter) {
      'active' => _loans.where((l) => l.isActive).toList(),
      'pending' => _loans.where((l) => l.isPending).toList(),
      _ => _loans,
    };
  }

  Future<void> _openApply() async {
    final user = ref.read(authProvider).user;
    if (!KycGuard.requireVerified(context, user)) return;
    await context.push(RouteNames.applyLoan);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Loans')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openApply,
        icon: const Icon(Icons.add),
        label: const Text('Apply'),
      ),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                _FilterChip(label: 'All', value: 'all', selected: _filter, onSelected: (v) => setState(() => _filter = v)),
                _FilterChip(label: 'Active', value: 'active', selected: _filter, onSelected: (v) => setState(() => _filter = v)),
                _FilterChip(label: 'Pending', value: 'pending', selected: _filter, onSelected: (v) => setState(() => _filter = v)),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _load,
                    child: _filtered.isEmpty
                        ? ListView(
                            children: [
                              const SizedBox(height: 120),
                              Icon(Icons.account_balance_outlined, size: 48, color: AppColors.textMuted.withValues(alpha: 0.5)),
                              const SizedBox(height: 16),
                              const Center(child: Text('No loans yet')),
                              const SizedBox(height: 24),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 48),
                                child: AppButton(
                                  label: 'Apply for a loan',
                                  onPressed: _openApply,
                                ),
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final loan = _filtered[index];
                              return _LoanCard(
                                loan: loan,
                                onTap: () => context.push('/loans/${loan.id}'),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _LoanCard extends StatelessWidget {
  const _LoanCard({required this.loan, required this.onTap});

  final LoanModel loan;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final statusColor = loan.isActive
        ? AppColors.success
        : loan.isPending
            ? AppColors.warning
            : loan.status == LoanStatus.rejected
                ? AppColors.error
                : AppColors.textSecondary;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(loan.productName, style: Theme.of(context).textTheme.titleMedium),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      loan.statusLabel,
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: statusColor),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(loan.loanNumber, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _Metric(
                      label: loan.isActive ? 'Outstanding' : 'Amount',
                      value: CurrencyFormatter.format(
                        loan.isActive ? loan.outstandingBalance : loan.principalAmount,
                      ),
                    ),
                  ),
                  Expanded(
                    child: _Metric(
                      label: 'Monthly',
                      value: CurrencyFormatter.format(loan.monthlyPayment),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        Text(value, style: Theme.of(context).textTheme.titleSmall),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.value,
    required this.selected,
    required this.onSelected,
  });

  final String label;
  final String value;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final isSelected = selected == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onSelected(value),
      ),
    );
  }
}
