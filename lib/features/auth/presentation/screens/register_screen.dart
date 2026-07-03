import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/utils/validators.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/core/widgets/pin_text_field.dart';
import 'package:tanjuriel_microfinance/features/auth/domain/models/customer_registration_input.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  int _step = 0;

  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _dob = TextEditingController();
  final _bvn = TextEditingController();
  final _nin = TextEditingController();
  final _address = TextEditingController();
  final _city = TextEditingController(text: 'Jos');
  final _state = TextEditingController(text: 'Plateau');
  final _occupation = TextEditingController();
  final _employer = TextEditingController();
  final _income = TextEditingController();
  final _pin = TextEditingController();
  final _confirmPin = TextEditingController();

  String _gender = 'MALE';
  bool _loading = false;

  @override
  void dispose() {
    for (final c in [
      _firstName, _lastName, _phone, _email, _dob, _bvn, _nin,
      _address, _city, _state, _occupation, _employer, _income, _pin, _confirmPin,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDob() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(1995, 1, 1),
      firstDate: DateTime(1940),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
    );
    if (picked != null) {
      _dob.text = DateFormat('yyyy-MM-dd').format(picked);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_pin.text != _confirmPin.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('PINs do not match')),
      );
      return;
    }

    setState(() => _loading = true);
    final input = CustomerRegistrationInput(
      firstName: _firstName.text.trim(),
      lastName: _lastName.text.trim(),
      phone: _phone.text.trim(),
      email: _email.text.trim(),
      dateOfBirth: DateTime.parse(_dob.text.trim()),
      gender: _gender,
      bvn: _bvn.text.trim(),
      nin: _nin.text.trim(),
      address: _address.text.trim(),
      city: _city.text.trim(),
      state: _state.text.trim(),
      occupation: _occupation.text.trim(),
      employer: _employer.text.trim(),
      monthlyIncome: double.tryParse(_income.text.trim()),
      pin: _pin.text.trim(),
    );

    final success = await ref.read(authProvider.notifier).register(input);
    if (!mounted) return;
    setState(() => _loading = false);

    if (success) {
      context.go(RouteNames.home);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ref.read(authProvider).errorMessage ?? 'Registration failed')),
      );
    }
  }

  void _next() {
    if (_step < 4) {
      setState(() => _step++);
    } else {
      _submit();
    }
  }

  void _back() {
    if (_step > 0) setState(() => _step--);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Open an account')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text('Step ${_step + 1} of 5', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            LinearProgressIndicator(value: (_step + 1) / 5),
            const SizedBox(height: 8),
            Text(
              'Head Office – Jos. BVN and NIN are required. You can use the app while verification is pending.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 24),
            if (_step == 0) ...[
              Text('Personal details', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              AppTextField(controller: _firstName, label: 'First name', validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              const SizedBox(height: 12),
              AppTextField(controller: _lastName, label: 'Last name', validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              const SizedBox(height: 12),
              AppTextField(controller: _phone, label: 'Phone number', keyboardType: TextInputType.phone, validator: Validators.phone),
              const SizedBox(height: 12),
              AppTextField(controller: _email, label: 'Email (optional)', keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 12),
              AppTextField(
                controller: _dob,
                label: 'Date of birth',
                readOnly: true,
                validator: (v) => v == null || v.isEmpty ? 'Select date of birth' : null,
                suffixIcon: IconButton(icon: const Icon(Icons.calendar_today), onPressed: _pickDob),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _gender,
                decoration: const InputDecoration(labelText: 'Gender'),
                items: const [
                  DropdownMenuItem(value: 'MALE', child: Text('Male')),
                  DropdownMenuItem(value: 'FEMALE', child: Text('Female')),
                ],
                onChanged: (v) => setState(() => _gender = v ?? 'MALE'),
              ),
            ],
            if (_step == 1) ...[
              Text('Address', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              AppTextField(controller: _address, label: 'Street address', validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              const SizedBox(height: 12),
              AppTextField(controller: _city, label: 'City', validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              const SizedBox(height: 12),
              AppTextField(controller: _state, label: 'State', validator: (v) => v == null || v.isEmpty ? 'Required' : null),
            ],
            if (_step == 2) ...[
              Text('Identity (mandatory)', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              AppTextField(
                controller: _bvn,
                label: 'BVN (11 digits)',
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(11)],
                validator: (v) => v == null || v.length != 11 ? 'Enter valid 11-digit BVN' : null,
              ),
              const SizedBox(height: 12),
              AppTextField(
                controller: _nin,
                label: 'NIN (11 digits)',
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(11)],
                validator: (v) => v == null || v.length != 11 ? 'Enter valid 11-digit NIN' : null,
              ),
            ],
            if (_step == 3) ...[
              Text('Employment (optional)', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              AppTextField(controller: _occupation, label: 'Occupation'),
              const SizedBox(height: 12),
              AppTextField(controller: _employer, label: 'Employer'),
              const SizedBox(height: 12),
              AppTextField(controller: _income, label: 'Monthly income (₦)', keyboardType: TextInputType.number, inputFormatters: [FilteringTextInputFormatter.digitsOnly]),
            ],
            if (_step == 4) ...[
              Text('Set transaction PIN', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              PinTextField(controller: _pin, label: 'Create PIN', validator: Validators.pin),
              const SizedBox(height: 12),
              PinTextField(
                controller: _confirmPin,
                label: 'Confirm PIN',
                validator: (v) => v != _pin.text ? 'PINs do not match' : Validators.pin(v),
              ),
            ],
            const SizedBox(height: 32),
            Row(
              children: [
                if (_step > 0)
                  Expanded(child: AppButton(label: 'Back', variant: AppButtonVariant.outline, onPressed: _back))
                else
                  const Expanded(child: SizedBox()),
                const SizedBox(width: 12),
                Expanded(
                  child: AppButton(
                    label: _step == 4 ? 'Submit' : 'Continue',
                    isLoading: _loading,
                    onPressed: _next,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
