import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/core/utils/validators.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/pin_text_field.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class ChangePinScreen extends ConsumerStatefulWidget {
  const ChangePinScreen({super.key});

  @override
  ConsumerState<ChangePinScreen> createState() => _ChangePinScreenState();
}

class _ChangePinScreenState extends ConsumerState<ChangePinScreen> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _newPin = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _current.dispose();
    _newPin.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(profileRepositoryProvider).updatePin(
            currentPin: _current.text,
            newPin: _newPin.text,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('PIN updated successfully')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Change PIN')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              PinTextField(controller: _current, label: 'Current PIN', validator: Validators.pin),
              const SizedBox(height: 16),
              PinTextField(controller: _newPin, label: 'New PIN', validator: Validators.pin),
              const SizedBox(height: 16),
              PinTextField(
                controller: _confirm,
                label: 'Confirm New PIN',
                validator: (v) => v != _newPin.text ? 'PINs do not match' : null,
              ),
              const SizedBox(height: 32),
              AppButton(label: 'Update PIN', isLoading: _loading, onPressed: _submit),
            ],
          ),
        ),
      ),
    );
  }
}
