import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:tanjuriel_microfinance/core/constants/nigeria_locations.dart';
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
  static const _stepTitles = [
    'Personal information',
    'Contact details',
    'Valid means of identification',
    'Employment details',
    'Member photo',
    'Create PIN',
  ];

  final _formKey = GlobalKey<FormState>();
  int _step = 0;
  bool _loading = false;
  bool _locationsReady = false;

  String? _title;
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _middleName = TextEditingController();
  String _maritalStatus = 'SINGLE';
  String _gender = 'MALE';
  final _dob = TextEditingController();
  final _phone = TextEditingController();
  final _alternatePhone = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  String _state = 'Plateau';
  String? _lga;
  final _city = TextEditingController(text: 'Jos');
  final _bvn = TextEditingController();
  final _nin = TextEditingController();
  String _employmentStatus = 'UNEMPLOYED';
  final _employmentStatusNote = TextEditingController();
  final _employmentStartDate = TextEditingController();
  String? _incomeBand;
  final _occupation = TextEditingController();
  final _employer = TextEditingController();
  final _employerPhone = TextEditingController();
  final _employerEmail = TextEditingController();
  final _employerAddress = TextEditingController();
  final _natureOfBusiness = TextEditingController();
  final _officeNumber = TextEditingController();
  final _officePhone = TextEditingController();
  String? _officeState;
  String? _officeLga;
  String? _photoPath;
  final _pin = TextEditingController();
  final _confirmPin = TextEditingController();

  @override
  void initState() {
    super.initState();
    NigeriaLocations.ensureLoaded().then((_) {
      if (mounted) setState(() => _locationsReady = true);
    });
  }

  @override
  void dispose() {
    for (final c in [
      _firstName, _lastName, _middleName, _dob, _phone, _alternatePhone, _email,
      _address, _city, _bvn, _nin, _employmentStatusNote, _employmentStartDate,
      _occupation, _employer, _employerPhone, _employerEmail, _employerAddress,
      _natureOfBusiness, _officeNumber, _officePhone, _pin, _confirmPin,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  int? get _age {
    if (_dob.text.isEmpty) return null;
    final birth = DateTime.tryParse(_dob.text.trim());
    if (birth == null) return null;
    final today = DateTime.now();
    var age = today.year - birth.year;
    if (today.month < birth.month || (today.month == birth.month && today.day < birth.day)) {
      age--;
    }
    return age;
  }

  bool get _employerVisible =>
      _employmentStatus == 'EMPLOYED' || _employmentStatus == 'SELF_EMPLOYED';

  Future<void> _pickDob() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(1995, 1, 1),
      firstDate: DateTime(1940),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
    );
    if (picked != null) {
      _dob.text = DateFormat('yyyy-MM-dd').format(picked);
      setState(() {});
    }
  }

  Future<void> _pickEmploymentDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1970),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      _employmentStartDate.text = DateFormat('yyyy-MM-dd').format(picked);
      setState(() {});
    }
  }

  Future<void> _takePhoto() async {
    final file = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 70);
    if (file != null) setState(() => _photoPath = file.path);
  }

  String? _validateStep() {
    switch (_step) {
      case 0:
        if (_firstName.text.trim().isEmpty || _lastName.text.trim().isEmpty) {
          return 'First name and surname are required';
        }
        if (_dob.text.isEmpty) return 'Select date of birth';
        if (_age != null && _age! < 18) return 'You must be at least 18 years old';
        return null;
      case 1:
        if (_phone.text.trim().isEmpty) return 'Phone number is required';
        if (_address.text.trim().isEmpty || _city.text.trim().isEmpty) {
          return 'Complete your residential address';
        }
        return null;
      case 2:
        if (_bvn.text.length != 11) return 'Enter valid 11-digit BVN';
        if (_nin.text.length != 11) return 'Enter valid 11-digit NIN';
        return null;
      case 3:
        if (_employmentStatus == 'OTHER' && _employmentStatusNote.text.trim().isEmpty) {
          return 'Please specify your employment status';
        }
        return null;
      case 4:
        if (_photoPath == null) return 'Member photo is required';
        return null;
      case 5:
        if (_pin.text != _confirmPin.text) return 'PINs do not match';
        return null;
      default:
        return null;
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    final input = CustomerRegistrationInput(
      title: _title,
      firstName: _firstName.text.trim(),
      lastName: _lastName.text.trim(),
      middleName: _middleName.text.trim(),
      maritalStatus: _maritalStatus,
      phone: _phone.text.trim(),
      alternatePhone: _alternatePhone.text.trim(),
      email: _email.text.trim(),
      dateOfBirth: DateTime.parse(_dob.text.trim()),
      gender: _gender,
      bvn: _bvn.text.trim(),
      nin: _nin.text.trim(),
      address: _address.text.trim(),
      lga: _lga,
      city: _city.text.trim(),
      state: _state,
      employmentStatus: _employmentStatus,
      employmentStatusNote: _employmentStatusNote.text.trim(),
      employmentStartDate: _employmentStartDate.text.isNotEmpty
          ? DateTime.parse(_employmentStartDate.text.trim())
          : null,
      incomeBand: _incomeBand,
      occupation: _occupation.text.trim(),
      employer: _employer.text.trim(),
      employerPhone: _employerPhone.text.trim(),
      employerEmail: _employerEmail.text.trim(),
      employerAddress: _employerAddress.text.trim(),
      natureOfBusiness: _natureOfBusiness.text.trim(),
      officeNumber: _officeNumber.text.trim(),
      officePhone: _officePhone.text.trim(),
      officeState: _officeState,
      officeLga: _officeLga,
      pin: _pin.text.trim(),
      photoPath: _photoPath!,
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
    final err = _validateStep();
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      return;
    }
    if (_step < _stepTitles.length - 1) {
      setState(() => _step++);
    } else {
      _submit();
    }
  }

  void _handleBack() {
    if (_step > 0) {
      setState(() => _step--);
      return;
    }
    if (context.canPop()) {
      context.pop();
    } else {
      context.go(RouteNames.welcome);
    }
  }

  Widget _dropdown({
    required String label,
    required String? value,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?> onChanged,
    List<Widget>? selectedItemBuilder,
  }) {
    return DropdownButtonFormField<String>(
      isExpanded: true,
      value: value,
      decoration: InputDecoration(labelText: label),
      selectedItemBuilder: selectedItemBuilder != null
          ? (context) => selectedItemBuilder
          : null,
      items: items,
      onChanged: onChanged,
    );
  }

  static Widget _dropdownText(String text) {
    return Text(
      text,
      overflow: TextOverflow.ellipsis,
      maxLines: 2,
      softWrap: true,
    );
  }

  static const _incomeBandOptions = [
    (value: null, label: 'Select range'),
    (value: 'BELOW_50K', label: 'Less than ₦50,000'),
    (value: 'BAND_51K_250K', label: '₦51,000 – ₦250,000'),
    (value: 'BAND_251K_500K', label: '₦251,000 – ₦500,000'),
    (value: 'BAND_501K_1M', label: '₦501,000 – less than ₦1M'),
    (value: 'BAND_1M_5M', label: '₦1M – less than ₦5M'),
    (value: 'BAND_5M_10M', label: '₦5M – less than ₦10M'),
    (value: 'BAND_10M_20M', label: '₦10M – less than ₦20M'),
    (value: 'ABOVE_20M', label: 'Above ₦20 million'),
  ];

  @override
  Widget build(BuildContext context) {
    if (!_locationsReady) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final residentialLgas = NigeriaLocations.lgasFor(_state);
    final officeLgas = _officeState != null ? NigeriaLocations.lgasFor(_officeState!) : const <String>[];

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Open an account'),
          leading: BackButton(onPressed: _handleBack),
        ),
        body: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: Form(
                  key: _formKey,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                    children: [
            Text('Step ${_step + 1} of ${_stepTitles.length}', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            LinearProgressIndicator(value: (_step + 1) / _stepTitles.length),
            const SizedBox(height: 8),
            Text(_stepTitles[_step], style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              'Head Office – Jos. Complete your profile; you can use the app while KYC is pending.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 24),
            if (_step == 0) ...[
              _dropdown(
                label: 'Title',
                value: _title,
                items: const [
                  DropdownMenuItem(value: null, child: Text('Select title')),
                  DropdownMenuItem(value: 'MR', child: Text('Mr')),
                  DropdownMenuItem(value: 'MRS', child: Text('Mrs')),
                  DropdownMenuItem(value: 'MS', child: Text('Ms')),
                  DropdownMenuItem(value: 'MISS', child: Text('Miss')),
                  DropdownMenuItem(value: 'DR', child: Text('Dr')),
                  DropdownMenuItem(value: 'CHIEF', child: Text('Chief')),
                  DropdownMenuItem(value: 'ENGR', child: Text('Engr')),
                  DropdownMenuItem(value: 'BARR', child: Text('Barr')),
                  DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                ],
                onChanged: (v) => setState(() => _title = v),
              ),
              const SizedBox(height: 12),
              AppTextField(controller: _firstName, label: 'First name', validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              const SizedBox(height: 12),
              AppTextField(controller: _lastName, label: 'Surname', validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              const SizedBox(height: 12),
              AppTextField(controller: _middleName, label: 'Other name'),
              const SizedBox(height: 12),
              _dropdown(
                label: 'Marital status',
                value: _maritalStatus,
                items: const [
                  DropdownMenuItem(value: 'MARRIED', child: Text('Married')),
                  DropdownMenuItem(value: 'SINGLE', child: Text('Single')),
                  DropdownMenuItem(value: 'DIVORCED', child: Text('Divorced')),
                  DropdownMenuItem(value: 'WIDOWED', child: Text('Widowed')),
                  DropdownMenuItem(value: 'LIVING_WITH_COMPANION', child: Text('Living with companion')),
                ],
                onChanged: (v) => setState(() => _maritalStatus = v ?? 'SINGLE'),
              ),
              const SizedBox(height: 12),
              _dropdown(
                label: 'Gender',
                value: _gender,
                items: const [
                  DropdownMenuItem(value: 'MALE', child: Text('Male')),
                  DropdownMenuItem(value: 'FEMALE', child: Text('Female')),
                ],
                onChanged: (v) => setState(() => _gender = v ?? 'MALE'),
              ),
              const SizedBox(height: 12),
              AppTextField(
                controller: _dob,
                label: 'Date of birth',
                readOnly: true,
                validator: (v) => v == null || v.isEmpty ? 'Select date of birth' : null,
                suffixIcon: IconButton(icon: const Icon(Icons.calendar_today), onPressed: _pickDob),
              ),
              if (_age != null) ...[
                const SizedBox(height: 12),
                AppTextField(label: 'Age', readOnly: true, controller: TextEditingController(text: '$_age years')),
              ],
            ],
            if (_step == 1) ...[
              AppTextField(controller: _phone, label: 'Phone number', keyboardType: TextInputType.phone, validator: Validators.phone),
              const SizedBox(height: 12),
              AppTextField(controller: _alternatePhone, label: 'Alternate phone', keyboardType: TextInputType.phone),
              const SizedBox(height: 12),
              AppTextField(controller: _email, label: 'Email address', keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 12),
              AppTextField(controller: _address, label: 'Street / residential address', validator: (v) => v == null || v.isEmpty ? 'Required' : null),
              const SizedBox(height: 12),
              _dropdown(
                label: 'State',
                value: _state,
                items: NigeriaLocations.states.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) => setState(() {
                  _state = v ?? _state;
                  _lga = null;
                }),
              ),
              const SizedBox(height: 12),
              _dropdown(
                label: 'Local government area',
                value: _lga,
                items: [
                  const DropdownMenuItem(value: null, child: Text('Select LGA')),
                  ...residentialLgas.map((l) => DropdownMenuItem(value: l, child: Text(l))),
                ],
                onChanged: (v) => setState(() => _lga = v),
              ),
              const SizedBox(height: 12),
              AppTextField(controller: _city, label: 'City / town', validator: (v) => v == null || v.isEmpty ? 'Required' : null),
            ],
            if (_step == 2) ...[
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
              _dropdown(
                label: 'Employment status',
                value: _employmentStatus,
                items: const [
                  DropdownMenuItem(value: 'EMPLOYED', child: Text('Employed')),
                  DropdownMenuItem(value: 'SELF_EMPLOYED', child: Text('Self-employed')),
                  DropdownMenuItem(value: 'UNEMPLOYED', child: Text('Unemployed')),
                  DropdownMenuItem(value: 'RETIRED', child: Text('Retired')),
                  DropdownMenuItem(value: 'STUDENT', child: Text('Student')),
                  DropdownMenuItem(value: 'OTHER', child: Text('Others (please specify)')),
                ],
                onChanged: (v) => setState(() => _employmentStatus = v ?? 'UNEMPLOYED'),
              ),
              if (_employmentStatus == 'OTHER') ...[
                const SizedBox(height: 12),
                AppTextField(controller: _employmentStatusNote, label: 'Specify employment status'),
              ],
              if (_employmentStatus == 'EMPLOYED') ...[
                const SizedBox(height: 12),
                AppTextField(
                  controller: _employmentStartDate,
                  label: 'Date of employment',
                  readOnly: true,
                  suffixIcon: IconButton(icon: const Icon(Icons.calendar_today), onPressed: _pickEmploymentDate),
                ),
              ],
              const SizedBox(height: 12),
              _dropdown(
                label: 'Annual salary / expected income',
                value: _incomeBand,
                selectedItemBuilder: _incomeBandOptions
                    .map((o) => Align(
                          alignment: Alignment.centerLeft,
                          child: _dropdownText(o.label),
                        ))
                    .toList(),
                items: _incomeBandOptions
                    .map(
                      (o) => DropdownMenuItem<String>(
                        value: o.value,
                        child: _dropdownText(o.label),
                      ),
                    )
                    .toList(),
                onChanged: (v) => setState(() => _incomeBand = v),
              ),
              if (_employerVisible) ...[
                const SizedBox(height: 12),
                AppTextField(controller: _employer, label: 'Employer / business name'),
                const SizedBox(height: 12),
                AppTextField(controller: _natureOfBusiness, label: 'Nature of business'),
                const SizedBox(height: 12),
                AppTextField(controller: _employerPhone, label: 'Employer phone', keyboardType: TextInputType.phone),
                const SizedBox(height: 12),
                AppTextField(controller: _employerEmail, label: 'Employer email', keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 12),
                AppTextField(controller: _employerAddress, label: 'Employer address'),
                const SizedBox(height: 12),
                AppTextField(controller: _occupation, label: 'Occupation / job title'),
                const SizedBox(height: 12),
                AppTextField(controller: _officeNumber, label: 'Office number'),
                const SizedBox(height: 12),
                AppTextField(controller: _officePhone, label: 'Office phone', keyboardType: TextInputType.phone),
                const SizedBox(height: 12),
                _dropdown(
                  label: 'Office state',
                  value: _officeState,
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Select state')),
                    ...NigeriaLocations.states.map((s) => DropdownMenuItem(value: s, child: Text(s))),
                  ],
                  onChanged: (v) => setState(() {
                    _officeState = v;
                    _officeLga = null;
                  }),
                ),
                const SizedBox(height: 12),
                _dropdown(
                  label: 'Office LGA',
                  value: _officeLga,
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Select LGA')),
                    ...officeLgas.map((l) => DropdownMenuItem(value: l, child: Text(l))),
                  ],
                  onChanged: (v) => setState(() => _officeLga = v),
                ),
              ],
            ],
            if (_step == 4) ...[
              Text('Take a clear photo of your face using the camera.', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 16),
              if (_photoPath != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(File(_photoPath!), height: 180, width: 180, fit: BoxFit.cover),
                )
              else
                Container(
                  height: 180,
                  width: 180,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.person_outline, size: 64),
                ),
              const SizedBox(height: 16),
              AppButton(
                label: _photoPath == null ? 'Take photo' : 'Retake photo',
                variant: AppButtonVariant.outline,
                onPressed: _takePhoto,
                icon: Icons.camera_alt_outlined,
              ),
            ],
            if (_step == 5) ...[
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
            const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
                child: Row(
                  children: [
                    if (_step > 0)
                      Expanded(child: AppButton(label: 'Back', variant: AppButtonVariant.outline, onPressed: _handleBack))
                    else
                      const Expanded(child: SizedBox()),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AppButton(
                        label: _step == _stepTitles.length - 1 ? 'Submit' : 'Continue',
                        isLoading: _loading,
                        onPressed: _next,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
