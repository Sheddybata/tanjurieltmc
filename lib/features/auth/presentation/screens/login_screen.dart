import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/core/config/app_config.dart';
import 'package:tanjuriel_microfinance/core/utils/validators.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/core/widgets/pin_text_field.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phone = TextEditingController(text: AppConfig.useMockApi ? AppConfig.demoPhone : '');
  final _pin = TextEditingController(text: AppConfig.useMockApi ? AppConfig.demoPin : '');
  bool _isLoading = false;

  @override
  void dispose() {
    _phone.dispose();
    _pin.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final success = await ref.read(authProvider.notifier).login(
          phone: _phone.text.trim(),
          pin: _pin.text.trim(),
        );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (!success) {
      final message = ref.read(authProvider).errorMessage ??
          'Login failed. Check your phone and PIN.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign In')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome back', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                'Sign in with your phone number and transaction PIN',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (AppConfig.useMockApi) ...[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Demo mode — no server required. Use ${AppConfig.demoPhone} / PIN ${AppConfig.demoPin}.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
              const SizedBox(height: 24),
              AppTextField(
                controller: _phone,
                label: 'Phone number',
                keyboardType: TextInputType.phone,
                validator: Validators.phone,
              ),
              const SizedBox(height: 16),
              PinTextField(
                controller: _pin,
                label: 'Transaction PIN',
                validator: Validators.pin,
              ),
              const SizedBox(height: 32),
              AppButton(label: 'Sign In', isLoading: _isLoading, onPressed: _login),
            ],
          ),
        ),
      ),
    );
  }
}
