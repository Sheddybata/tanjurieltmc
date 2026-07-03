import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/core/utils/receipt_share_util.dart';
import 'package:tanjuriel_microfinance/core/widgets/transfer_receipt_card.dart';
import 'package:tanjuriel_microfinance/shared/models/transaction_model.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class TransactionDetailScreen extends ConsumerStatefulWidget {
  const TransactionDetailScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<TransactionDetailScreen> createState() => _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends ConsumerState<TransactionDetailScreen> {
  final _receiptKey = GlobalKey();
  TransactionModel? _transaction;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final txn = await ref.read(transactionRepositoryProvider).getTransactionById(widget.id);
      if (mounted) setState(() { _transaction = txn; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _shareReceipt(ReceiptData data) async {
    await ReceiptShareUtil.showShareOptions(
      context,
      boundaryKey: _receiptKey,
      data: data,
      fileBaseName: 'receipt_${data.reference}',
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final txn = _transaction;
    if (txn == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Transaction not found')),
      );
    }

    final isCredit = txn.type == TransactionType.credit;
    final color = isCredit ? AppColors.credit : AppColors.debit;
    final receiptData = ReceiptData.fromTransaction(txn);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Receipt'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () => _shareReceipt(receiptData),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isCredit ? Icons.arrow_downward : Icons.arrow_upward,
                color: color,
                size: 36,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '${isCredit ? '+' : '-'}${CurrencyFormatter.format(txn.amount)}',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 4),
            Text(txn.status.label, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 32),
            RepaintBoundary(
              key: _receiptKey,
              child: TransferReceiptCard(data: receiptData),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: txn.reference));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Reference copied')),
                );
              },
              icon: const Icon(Icons.copy),
              label: const Text('Copy Reference'),
            ),
          ],
        ),
      ),
    );
  }
}
