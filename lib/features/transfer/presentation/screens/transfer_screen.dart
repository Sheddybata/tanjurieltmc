import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/constants/nibss_codes.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/utils/validators.dart';
import 'package:tanjuriel_microfinance/core/widgets/account_switcher.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/models/transfer_model.dart';
import 'package:tanjuriel_microfinance/shared/providers/member_accounts_provider.dart';
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
  bool _nameEnquiryAvailable = false;
  bool _lookingUpName = false;
  bool _nameVerified = false;
  String? _nameLookupError;
  String _sessionId = const Uuid().v4();

  @override
  void initState() {
    super.initState();
    _loadBanks();
    _accountNumber.addListener(_onAccountNumberChanged);
  }

  @override
  void dispose() {
    _accountNumber.removeListener(_onAccountNumberChanged);
    _accountNumber.dispose();
    _beneficiaryName.dispose();
    _amount.dispose();
    _narration.dispose();
    super.dispose();
  }

  Future<void> _loadBanks() async {
    try {
      final repo = ref.read(transferRepositoryProvider);
      final results = await Future.wait([
        repo.getBanks(),
        repo.isNameEnquiryAvailable(),
      ]);
      if (!mounted) return;
      setState(() {
        _banks = results[0] as List<BankModel>;
        _nameEnquiryAvailable = results[1] as bool;
        _loadingBanks = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingBanks = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not load banks: $e')),
      );
    }
  }

  void _onAccountNumberChanged() {
    if (_accountNumber.text.length == 10 && _selectedBank != null && _nameEnquiryAvailable) {
      _lookupName();
    } else if (_accountNumber.text.length != 10) {
      setState(() {
        _nameVerified = false;
        _nameLookupError = null;
        _beneficiaryName.clear();
        _sessionId = const Uuid().v4();
      });
    }
  }

  Future<void> _lookupName() async {
    final bank = _selectedBank;
    final account = _accountNumber.text.trim();
    if (bank == null || account.length != 10) return;

    setState(() {
      _lookingUpName = true;
      _nameLookupError = null;
      _nameVerified = false;
    });

    try {
      final result = await ref.read(transferRepositoryProvider).nameEnquiry(
            bankCode: bank.nibssCode,
            accountNumber: account,
          );

      if (!mounted) return;

      if (result.isSuccess && result.accountName.isNotEmpty) {
        setState(() {
          _beneficiaryName.text = result.accountName;
          _nameVerified = true;
          _sessionId = result.sessionId.isNotEmpty ? result.sessionId : const Uuid().v4();
        });
      } else {
        setState(() {
          _nameLookupError = result.responseMessage ??
              NibssResponseCodes.message(result.responseCode);
          _beneficiaryName.clear();
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _nameLookupError = e.toString();
        _beneficiaryName.clear();
      });
    } finally {
      if (mounted) setState(() => _lookingUpName = false);
    }
  }

  void _proceed() {
    final user = ref.read(authProvider).user;
    final selected = ref.read(selectedAccountProvider);
    if (!KycGuard.requireVerified(context, user)) return;
    if (selected != null && !selected.canTransferOnMobile) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${selected.displayName} cannot be transferred from on mobile. Visit your branch.')),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    if (_nameEnquiryAvailable && !_nameVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verify the account name before continuing')),
      );
      return;
    }

    final name = _beneficiaryName.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter or verify beneficiary name')),
      );
      return;
    }

    context.push(RouteNames.transferConfirm, extra: {
      'bank': _selectedBank!,
      'accountNumber': _accountNumber.text,
      'accountName': name,
      'amount': double.parse(_amount.text.replaceAll(',', '')),
      'narration': _narration.text,
      'sessionId': _sessionId,
    });
  }

  @override
  Widget build(BuildContext context) {
    final selected = ref.watch(selectedAccountProvider);

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
                    const Text('From account'),
                    const SizedBox(height: 8),
                    const AccountSwitcher(),
                    if (selected != null && !selected.canTransferOnMobile) ...[
                      const SizedBox(height: 12),
                      Text(
                        selected.mobileRulesSummary,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.amber.shade800),
                      ),
                    ],
                    const SizedBox(height: 24),
                    Text('Send Money', style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(
                      _nameEnquiryAvailable
                          ? 'Select a bank, enter the account number, and we will verify the account name before you send.'
                          : 'Transfer to any Nigerian bank. Your request will be reviewed by a manager.',
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
                      onChanged: (bank) {
                        setState(() {
                          _selectedBank = bank;
                          _nameVerified = false;
                          _nameLookupError = null;
                          _beneficiaryName.clear();
                        });
                        if (_accountNumber.text.length == 10 && _nameEnquiryAvailable) {
                          _lookupName();
                        }
                      },
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
                      suffixIcon: _nameEnquiryAvailable && _selectedBank != null
                          ? (_lookingUpName
                              ? const Padding(
                                  padding: EdgeInsets.all(12),
                                  child: SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                )
                              : IconButton(
                                  icon: const Icon(Icons.verified_user_outlined),
                                  onPressed: _lookupName,
                                  tooltip: 'Verify account name',
                                ))
                          : null,
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _beneficiaryName,
                      label: _nameEnquiryAvailable ? 'Account name' : 'Beneficiary name',
                      hint: _nameEnquiryAvailable ? 'Verified automatically' : 'Account holder name',
                      readOnly: _nameEnquiryAvailable && _nameVerified,
                      validator: _nameEnquiryAvailable
                          ? null
                          : (v) => (v == null || v.trim().isEmpty) ? 'Enter beneficiary name' : null,
                    ),
                    if (_nameLookupError != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _nameLookupError!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context).colorScheme.error,
                            ),
                      ),
                    ],
                    if (_nameVerified) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.check_circle, size: 18, color: Colors.green.shade700),
                          const SizedBox(width: 6),
                          Text(
                            'Account name verified',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.green.shade700,
                                ),
                          ),
                        ],
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
