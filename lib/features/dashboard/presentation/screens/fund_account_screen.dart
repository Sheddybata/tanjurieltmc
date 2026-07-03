import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';

class FundAccountScreen extends ConsumerStatefulWidget {
  const FundAccountScreen({super.key});

  @override
  ConsumerState<FundAccountScreen> createState() => _FundAccountScreenState();
}

class _FundAccountScreenState extends ConsumerState<FundAccountScreen> {
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();
  List<Map<String, dynamic>> _banks = [];
  String? _selectedProvider;
  bool _loading = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadBanks();
  }

  Future<void> _loadBanks() async {
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.get<Map<String, dynamic>>('/customer/settlement-accounts');
      final data = (res.data?['data'] as List<dynamic>?) ?? [];
      setState(() {
        _banks = data.cast<Map<String, dynamic>>();
        if (_banks.isNotEmpty) _selectedProvider = _banks.first['provider'] as String?;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    final user = ref.read(authProvider).user;
    if (!KycGuard.requireVerified(context, user)) return;
    final amount = double.tryParse(_amountController.text);
    if (user?.accountId == null || amount == null || amount <= 0 || _selectedProvider == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid amount and select a bank')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post('/customer/deposit-requests', data: {
        'accountId': user!.accountId,
        'amount': amount,
        'settlementProvider': _selectedProvider,
        'customerNote': _noteController.text.trim().isEmpty ? null : _noteController.text.trim(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Deposit request submitted. A manager will verify your payment.')),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _copy(String value, String label) {
    Clipboard.setData(ClipboardData(text: value));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$label copied')));
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final selectedBank = _banks.cast<Map<String, dynamic>?>().firstWhere(
          (b) => b?['provider'] == _selectedProvider,
          orElse: () => null,
        );

    return Scaffold(
      appBar: AppBar(title: const Text('Fund Account')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Transfer to Tanjuriel account',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Send money from your bank app, then submit this form. A manager will verify and credit your balance.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 24),
                  if (user?.paymentRef != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Your payment reference', style: Theme.of(context).textTheme.labelLarge),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  user!.paymentRef!,
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primary,
                                      ),
                                ),
                              ),
                              IconButton(
                                onPressed: () => _copy(user.paymentRef!, 'Reference'),
                                icon: const Icon(Icons.copy),
                              ),
                            ],
                          ),
                          const Text('Include this reference in your transfer narration'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                  Text('Pay into', style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 8),
                  ..._banks.map((bank) {
                    final provider = bank['provider'] as String;
                    return RadioListTile<String>(
                      value: provider,
                      groupValue: _selectedProvider,
                      onChanged: (v) => setState(() => _selectedProvider = v),
                      title: Text(bank['bankName'] as String),
                      subtitle: Text('${bank['accountName']}\n${bank['accountNumber']}'),
                    );
                  }),
                  if (selectedBank != null)
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => _copy(selectedBank['accountNumber'] as String, 'Account number'),
                        child: const Text('Copy account number'),
                      ),
                    ),
                  const SizedBox(height: 16),
                  AppTextField(
                    controller: _amountController,
                    label: 'Amount sent (NGN)',
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: _noteController,
                    label: 'Note (optional)',
                    hint: 'e.g. Sent from GTBank',
                  ),
                  const SizedBox(height: 24),
                  AppButton(
                    label: 'Submit deposit request',
                    isLoading: _submitting,
                    onPressed: _submit,
                  ),
                ],
              ),
            ),
    );
  }
}
