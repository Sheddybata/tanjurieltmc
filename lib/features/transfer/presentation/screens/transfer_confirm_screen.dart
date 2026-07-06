import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/core/widgets/pin_input_field.dart';
import 'package:tanjuriel_microfinance/shared/models/transfer_model.dart';
import 'package:tanjuriel_microfinance/shared/providers/member_accounts_provider.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class TransferConfirmScreen extends ConsumerStatefulWidget {
  const TransferConfirmScreen({
    super.key,
    required this.bank,
    required this.accountNumber,
    required this.accountName,
    required this.amount,
    required this.narration,
    required this.sessionId,
  });

  final BankModel bank;
  final String accountNumber;
  final String accountName;
  final double amount;
  final String narration;
  final String sessionId;

  @override
  ConsumerState<TransferConfirmScreen> createState() => _TransferConfirmScreenState();
}

class _TransferConfirmScreenState extends ConsumerState<TransferConfirmScreen> {
  bool _isLoading = false;
  double _fee = 25;
  bool _loadingFee = true;

  @override
  void initState() {
    super.initState();
    _loadFee();
  }

  Future<void> _loadFee() async {
    final fee = await ref.read(transferRepositoryProvider).getTransferFee();
    if (mounted) setState(() {
      _fee = fee;
      _loadingFee = false;
    });
  }

  Future<void> _confirm(String pin) async {
    if (_isLoading) return;

    setState(() => _isLoading = true);
    try {
      final accountId = ref.read(selectedAccountProvider)?.id;
      final result = await ref.read(transferRepositoryProvider).initiateTransfer(
            TransferRequest(
              destinationBankCode: widget.bank.nibssCode,
              destinationAccountNumber: widget.accountNumber,
              amount: widget.amount,
              narration: widget.narration,
              sessionId: widget.sessionId,
              pin: pin,
              accountId: accountId,
              beneficiaryName: widget.accountName,
              beneficiaryBankName: widget.bank.name,
            ),
          );

      if (!mounted) return;

      if (result.isSuccess) {
        context.go(
          RouteNames.transferSuccess,
          extra: result.withBeneficiaryDetails(
            beneficiaryName: widget.accountName,
            beneficiaryAccount: widget.accountNumber,
            beneficiaryBank: widget.bank.name,
            narration: widget.narration,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.responseMessage)),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Confirm Transfer')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    _DetailRow(label: 'Bank', value: widget.bank.name),
                    _DetailRow(label: 'Account', value: widget.accountNumber),
                    _DetailRow(label: 'Name', value: widget.accountName),
                    const Divider(),
                    _DetailRow(label: 'Amount', value: CurrencyFormatter.format(widget.amount)),
                    _DetailRow(label: 'Fee', value: _loadingFee ? '…' : CurrencyFormatter.format(_fee)),
                    _DetailRow(
                      label: 'Total',
                      value: CurrencyFormatter.format(widget.amount + _fee),
                      highlight: true,
                    ),
                    if (widget.narration.isNotEmpty)
                      _DetailRow(label: 'Narration', value: widget.narration),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            Text('Enter your transaction PIN', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 24),
            PinInputField(onCompleted: _confirm),
            if (_isLoading) ...[
              const SizedBox(height: 24),
              const CircularProgressIndicator(),
            ],
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value, this.highlight = false});
  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Flexible(
            child: Text(
              value,
              style: highlight
                  ? Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.primary)
                  : Theme.of(context).textTheme.titleSmall,
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
