import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/utils/validators.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/models/transfer_model.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';
import 'package:uuid/uuid.dart';

class TransferScreen extends ConsumerStatefulWidget {
  const TransferScreen({super.key});

  @override
  ConsumerState<TransferScreen> createState() => _TransferScreenState();
}

class _TransferScreenState extends ConsumerState<TransferScreen> {
  final _formKey = GlobalKey<FormState>();
  final _accountNumber = TextEditingController();
  final _beneficiaryName = TextEditingController();
  final _amount = TextEditingController();
  final _narration = TextEditingController();

  List<BankModel> _banks = [];
  BankModel? _selectedBank;
  bool _loadingBanks = true;

  @override
  void initState() {
    super.initState();
    _loadBanks();
  }

  @override
  void dispose() {
    _accountNumber.dispose();
    _beneficiaryName.dispose();
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

  void _proceed() {
    final user = ref.read(authProvider).user;
    if (!KycGuard.requireVerified(context, user)) return;
    if (!_formKey.currentState!.validate()) return;

    final name = _beneficiaryName.text.trim();
    context.push(RouteNames.transferConfirm, extra: {
      'bank': _selectedBank!,
      'accountNumber': _accountNumber.text,
      'accountName': name.isEmpty ? 'Beneficiary' : name,
      'amount': double.parse(_amount.text.replaceAll(',', '')),
      'narration': _narration.text,
      'sessionId': const Uuid().v4(),
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
                      onChanged: (bank) => setState(() => _selectedBank = bank),
                      validator: (v) => v == null ? 'Select a bank' : null,
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _accountNumber,
                      label: 'Account Number',
                      keyboardType: TextInputType.number,
                      maxLength: 10,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      validator: Validators.accountNumber,
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _beneficiaryName,
                      label: 'Beneficiary name (optional)',
                      hint: 'Account holder name',
                    ),
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
