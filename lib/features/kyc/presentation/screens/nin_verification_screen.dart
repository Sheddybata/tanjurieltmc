import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/utils/validators.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class NinVerificationScreen extends ConsumerStatefulWidget {
  const NinVerificationScreen({super.key});

  @override
  ConsumerState<NinVerificationScreen> createState() => _NinVerificationScreenState();
}

class _NinVerificationScreenState extends ConsumerState<NinVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nin = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  bool _isLoading = false;
  bool _initialized = false;

  @override
  void dispose() {
    _nin.dispose();
    _firstName.dispose();
    _lastName.dispose();
    super.dispose();
  }

  void _initializeFromUser() {
    if (_initialized) return;
    final user = ref.read(authProvider).user;
    _firstName.text = user?.firstName ?? '';
    _lastName.text = user?.lastName ?? '';
    _initialized = true;
  }

  Future<void> _verify() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      await ref.read(kycRepositoryProvider).verifyNin(
            nin: _nin.text,
            firstName: _firstName.text.trim(),
            lastName: _lastName.text.trim(),
          );
      if (mounted) context.push(RouteNames.faceCapture);
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
    _initializeFromUser();

    return Scaffold(
      appBar: AppBar(title: const Text('NIN Verification')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Verify your NIN', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                'National Identity Number verification via NIMC-integrated services.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              AppTextField(
                controller: _nin,
                label: 'National Identification Number (NIN)',
                keyboardType: TextInputType.number,
                maxLength: 11,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                validator: Validators.nin,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _firstName,
                label: 'First Name (as on NIN)',
                validator: (v) => Validators.required(v, field: 'First name'),
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _lastName,
                label: 'Last Name (as on NIN)',
                validator: (v) => Validators.required(v, field: 'Last name'),
              ),
              const SizedBox(height: 32),
              AppButton(label: 'Verify NIN', isLoading: _isLoading, onPressed: _verify),
            ],
          ),
        ),
      ),
    );
  }
}
