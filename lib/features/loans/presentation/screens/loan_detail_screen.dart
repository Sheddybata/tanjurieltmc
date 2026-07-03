import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/shared/models/loan_model.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class LoanDetailScreen extends ConsumerStatefulWidget {
  const LoanDetailScreen({super.key, required this.loanId});

  final String loanId;

  @override
  ConsumerState<LoanDetailScreen> createState() => _LoanDetailScreenState();
}

class _LoanDetailScreenState extends ConsumerState<LoanDetailScreen> {
  LoanModel? _loan;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final loan = await ref.read(loanRepositoryProvider).getLoan(widget.loanId);
      if (mounted) {
        setState(() {
          _loan = loan;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final loan = _loan;
    final dateFormat = DateFormat('d MMM yyyy');

    return Scaffold(
      appBar: AppBar(title: Text(loan?.loanNumber ?? 'Loan Details')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : loan == null
              ? const Center(child: Text('Loan not found'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      _SummaryCard(loan: loan),
                      if (loan.collateral != null || loan.guarantorName != null) ...[
                        const SizedBox(height: 24),
                        Text('Collateral & guarantor', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 12),
                        _CollateralCard(loan: loan),
                      ],
                      if (loan.nextDueSchedule != null) ...[
                        const SizedBox(height: 24),
                        Text('Next repayment', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 12),
                        Card(
                          child: ListTile(
                            leading: const Icon(Icons.event_outlined),
                            title: Text(dateFormat.format(loan.nextDueSchedule!.dueDate)),
                            subtitle: Text(CurrencyFormatter.format(loan.nextDueSchedule!.totalDue)),
                            trailing: const Text('Due'),
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      Text('Repayment summary', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 12),
                      _RepaymentSummary(loan: loan),
                      const SizedBox(height: 24),
                      Text('Schedule', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      if (loan.isActive)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(
                            'Repay at our Jos branch or contact your account officer.',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                          ),
                        ),
                      if (loan.schedules.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(child: Text('Schedule will appear after approval')),
                        )
                      else
                        ...loan.schedules.map(
                          (item) => _ScheduleTile(item: item, dateFormat: dateFormat),
                        ),
                    ],
                  ),
                ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.loan});

  final LoanModel loan;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(loan.productName, style: const TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 4),
          Text(
            loan.statusLabel,
            style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Text(
            loan.isActive ? 'Outstanding balance' : 'Principal',
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
          Text(
            CurrencyFormatter.format(loan.isActive ? loan.outstandingBalance : loan.principalAmount),
            style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w600),
          ),
          if (loan.purpose != null && loan.purpose!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text('Purpose: ${loan.purpose}', style: const TextStyle(color: Colors.white70, fontSize: 13)),
          ],
        ],
      ),
    );
  }
}

class _CollateralCard extends StatelessWidget {
  const _CollateralCard({required this.loan});

  final LoanModel loan;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (loan.collateralType != null)
              _Row(label: 'Type', value: loan.collateralType!.replaceAll('_', ' ')),
            if (loan.collateralEstimatedValue != null)
              _Row(label: 'Est. value', value: CurrencyFormatter.format(loan.collateralEstimatedValue!)),
            if (loan.collateral != null) _Row(label: 'Description', value: loan.collateral!),
            _Row(
              label: 'Collateral verified',
              value: loan.isCollateralVerified ? 'Yes' : 'Pending manager review',
            ),
            if (loan.guarantorName != null) _Row(label: 'Guarantor', value: loan.guarantorName!),
            if (loan.guarantorPhone != null) _Row(label: 'Guarantor phone', value: loan.guarantorPhone!),
          ],
        ),
      ),
    );
  }
}

class _RepaymentSummary extends StatelessWidget {
  const _RepaymentSummary({required this.loan});

  final LoanModel loan;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _Row(label: 'Principal', value: CurrencyFormatter.format(loan.principalAmount)),
            _Row(label: 'Total repayable', value: CurrencyFormatter.format(loan.totalRepayable)),
            _Row(label: 'Monthly payment', value: CurrencyFormatter.format(loan.monthlyPayment)),
            _Row(label: 'Tenure', value: '${loan.tenureMonths} months'),
            _Row(label: 'Interest rate', value: '${(loan.interestRate * 100).toStringAsFixed(1)}% / month'),
            if (loan.isActive) _Row(label: 'Total paid', value: CurrencyFormatter.format(loan.totalPaid)),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(value, style: Theme.of(context).textTheme.titleSmall),
        ],
      ),
    );
  }
}

class _ScheduleTile extends StatelessWidget {
  const _ScheduleTile({required this.item, required this.dateFormat});

  final LoanScheduleItem item;
  final DateFormat dateFormat;

  @override
  Widget build(BuildContext context) {
    final color = item.isPaid ? AppColors.success : AppColors.textSecondary;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: color.withValues(alpha: 0.15),
        child: Text('${item.installmentNumber}', style: TextStyle(color: color, fontWeight: FontWeight.w600)),
      ),
      title: Text(dateFormat.format(item.dueDate)),
      subtitle: item.isPaid ? Text('Paid ${CurrencyFormatter.format(item.paidAmount)}') : null,
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(CurrencyFormatter.format(item.totalDue), style: Theme.of(context).textTheme.titleSmall),
          Text(
            item.isPaid ? 'Paid' : 'Due',
            style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
