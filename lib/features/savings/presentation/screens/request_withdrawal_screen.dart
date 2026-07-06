import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/core/widgets/pin_input_field.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/models/member_account.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class RequestWithdrawalScreen extends ConsumerStatefulWidget {
  const RequestWithdrawalScreen({super.key, required this.account});

  final MemberAccount account;

  @override
  ConsumerState<RequestWithdrawalScreen> createState() => _RequestWithdrawalScreenState();
}

class _RequestWithdrawalScreenState extends ConsumerState<RequestWithdrawalScreen> {
  final _amountController = TextEditingController();
  final _narrationController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _amountController.dispose();
    _narrationController.dispose();
    super.dispose();
  }

  Future<void> _submit(String pin) async {
    final user = ref.read(authProvider).user;
    if (!KycGuard.requireVerified(context, user)) return;

    final amount = double.tryParse(_amountController.text.replaceAll(',', ''));
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid amount')),
      );
      return;
    }
    if (amount > widget.account.availableBalance) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Amount exceeds available balance')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post('/customer/withdrawal-requests', data: {
        'accountId': widget.account.id,
        'amount': amount,
        'pin': pin,
        if (_narrationController.text.trim().isNotEmpty) 'narration': _narrationController.text.trim(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Withdrawal request submitted. Visit your branch to collect cash after manager approval.'),
        ),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final account = widget.account;

    return Scaffold(
      appBar: AppBar(title: const Text('Request withdrawal')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(account.displayName, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(account.accountNumber, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 8),
            Text(
              'Available: ${CurrencyFormatter.format(account.availableBalance)}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            Text(
              'Your request goes to a manager for approval. After approval, collect cash at your Tanjuriel branch.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            AppTextField(
              controller: _amountController,
              label: 'Amount (NGN)',
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
              ],
            ),
            const SizedBox(height: 16),
            AppTextField(
              controller: _narrationController,
              label: 'Note (optional)',
              hint: 'Reason for withdrawal',
            ),
            const SizedBox(height: 24),
            Text('Confirm with your PIN', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 12),
            PinInputField(
              onCompleted: (pin) {
                if (!_submitting) _submit(pin);
              },
            ),
            if (_submitting) ...[
              const SizedBox(height: 24),
              const Center(child: CircularProgressIndicator()),
            ],
          ],
        ),
      ),
    );
  }
}
