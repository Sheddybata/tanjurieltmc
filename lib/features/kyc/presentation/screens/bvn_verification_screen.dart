import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/utils/validators.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class BvnVerificationScreen extends ConsumerStatefulWidget {
  const BvnVerificationScreen({super.key});

  @override
  ConsumerState<BvnVerificationScreen> createState() => _BvnVerificationScreenState();
}

class _BvnVerificationScreenState extends ConsumerState<BvnVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _bvn = TextEditingController();
  final _dob = TextEditingController();
  final _phone = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _bvn.dispose();
    _dob.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      await ref.read(kycRepositoryProvider).verifyBvn(
            bvn: _bvn.text,
            dateOfBirth: _dob.text,
            phone: _phone.text,
          );
      if (mounted) context.push(RouteNames.ninVerification);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('BVN Verification')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Verify your BVN', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                'Your BVN is securely verified via NIBSS-linked identity services.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              AppTextField(
                controller: _bvn,
                label: 'Bank Verification Number (BVN)',
                keyboardType: TextInputType.number,
                maxLength: 11,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                validator: Validators.bvn,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _dob,
                label: 'Date of Birth',
                hint: 'DD/MM/YYYY',
                readOnly: true,
                onChanged: (_) {},
                validator: (v) => Validators.required(v, field: 'Date of birth'),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.calendar_today),
                  onPressed: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime(1990),
                      firstDate: DateTime(1950),
                      lastDate: DateTime.now(),
                    );
                    if (date != null) {
                      _dob.text = '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
                    }
                  },
                ),
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _phone,
                label: 'Phone linked to BVN',
                keyboardType: TextInputType.phone,
                validator: Validators.phone,
              ),
              const SizedBox(height: 32),
              AppButton(label: 'Verify BVN', isLoading: _isLoading, onPressed: _verify),
            ],
          ),
        ),
      ),
    );
  }
}
