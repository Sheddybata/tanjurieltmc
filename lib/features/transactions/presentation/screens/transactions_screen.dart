import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/widgets/transaction_tile.dart';
import 'package:tanjuriel_microfinance/shared/models/transaction_model.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  List<TransactionModel> _transactions = [];
  bool _loading = true;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final txns = await ref.read(transactionRepositoryProvider).getTransactions();
    if (mounted) {
      setState(() {
        _transactions = txns;
        _loading = false;
      });
    }
  }

  List<TransactionModel> get _filtered {
    return switch (_filter) {
      'credit' => _transactions.where((t) => t.type == TransactionType.credit).toList(),
      'debit' => _transactions.where((t) => t.type == TransactionType.debit).toList(),
      _ => _transactions,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Transaction History')),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _FilterChip(label: 'All', value: 'all', selected: _filter, onSelected: _setFilter),
                _FilterChip(label: 'Credits', value: 'credit', selected: _filter, onSelected: _setFilter),
                _FilterChip(label: 'Debits', value: 'debit', selected: _filter, onSelected: _setFilter),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _load,
                    child: _filtered.isEmpty
                        ? ListView(children: const [SizedBox(height: 200, child: Center(child: Text('No transactions')))])
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, __) => const Divider(),
                            itemBuilder: (context, index) {
                              final txn = _filtered[index];
                              return TransactionTile(
                                transaction: txn,
                                onTap: () => context.push('/transactions/${txn.id}'),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  void _setFilter(String value) => setState(() => _filter = value);
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
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected == value,
        onSelected: (_) => onSelected(value),
      ),
    );
  }
}
