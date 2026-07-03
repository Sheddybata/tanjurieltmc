import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/utils/validators.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/models/transfer_model.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class TransferScreen extends ConsumerStatefulWidget {
  const TransferScreen({super.key});

  @override
  ConsumerState<TransferScreen> createState() => _TransferScreenState();
}

class _TransferScreenState extends ConsumerState<TransferScreen> {
  final _formKey = GlobalKey<FormState>();
  final _accountNumber = TextEditingController();
  final _amount = TextEditingController();
  final _narration = TextEditingController();

  List<BankModel> _banks = [];
  BankModel? _selectedBank;
  NameEnquiryResult? _enquiryResult;
  bool _loadingBanks = true;
  bool _enquiring = false;

  @override
  void initState() {
    super.initState();
    _loadBanks();
  }

  @override
  void dispose() {
    _accountNumber.dispose();
    _amount.dispose();
    _narration.dispose();
    super.dispose();
  }

  Future<void> _loadBanks() async {
    final banks = await ref.read(transferRepositoryProvider).getBanks();
    if (mounted) {
      setState(() {
        _banks = banks;
        _loadingBanks = false;
      });
    }
  }

  Future<void> _nameEnquiry() async {
    if (_selectedBank == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a bank')),
      );
      return;
    }
    if (Validators.accountNumber(_accountNumber.text) != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid 10-digit account number')),
      );
      return;
    }

    setState(() => _enquiring = true);
    try {
      final result = await ref.read(transferRepositoryProvider).nameEnquiry(
            bankCode: _selectedBank!.code,
            accountNumber: _accountNumber.text,
          );
      setState(() => _enquiryResult = result);

      if (!result.isSuccess && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account not found. Please verify details.')),
        );
      }
    } finally {
      if (mounted) setState(() => _enquiring = false);
    }
  }

  void _proceed() {
    final user = ref.read(authProvider).user;
    if (!KycGuard.requireVerified(context, user)) return;
    if (!_formKey.currentState!.validate()) return;
    if (_enquiryResult == null || !_enquiryResult!.isSuccess) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Complete name enquiry first')),
      );
      return;
    }

    context.push(RouteNames.transferConfirm, extra: {
      'bank': _selectedBank!,
      'accountNumber': _accountNumber.text,
      'accountName': _enquiryResult!.accountName,
      'amount': double.parse(_amount.text.replaceAll(',', '')),
      'narration': _narration.text,
      'sessionId': _enquiryResult!.sessionId,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Transfer')),
      body: _loadingBanks
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Send Money', style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(
                      'Transfer to any Nigerian bank. Your request will be reviewed by a manager.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 24),
                    Text('Select Bank', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<BankModel>(
                      initialValue: _selectedBank,
                      decoration: const InputDecoration(hintText: 'Choose bank'),
                      items: _banks
                          .map((b) => DropdownMenuItem(value: b, child: Text(b.name)))
                          .toList(),
                      onChanged: (bank) => setState(() {
                        _selectedBank = bank;
                        _enquiryResult = null;
                      }),
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _accountNumber,
                      label: 'Account Number',
                      keyboardType: TextInputType.number,
                      maxLength: 10,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      validator: Validators.accountNumber,
                      onChanged: (_) => setState(() => _enquiryResult = null),
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      label: 'Verify Account',
                      variant: AppButtonVariant.outline,
                      isLoading: _enquiring,
                      onPressed: _nameEnquiry,
                    ),
                    if (_enquiryResult?.isSuccess == true) ...[
                      const SizedBox(height: 16),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle, color: AppColors.success),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Account verified', style: Theme.of(context).textTheme.labelSmall),
                                  Text(
                                    _enquiryResult!.accountName,
                                    style: Theme.of(context).textTheme.titleMedium,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _amount,
                      label: 'Amount',
                      hint: '0.00',
                      keyboardType: TextInputType.number,
                      validator: (v) => Validators.amount(v, min: 100, max: 1000000),
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _narration,
                      label: 'Narration (optional)',
                      hint: 'Payment description',
                    ),
                    const SizedBox(height: 32),
                    AppButton(label: 'Continue', onPressed: _proceed),
                  ],
                ),
              ),
            ),
    );
  }
}
