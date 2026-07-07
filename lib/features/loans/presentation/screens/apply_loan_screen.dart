import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:tanjuriel_microfinance/core/constants/loan_application_options.dart';
import 'package:tanjuriel_microfinance/core/constants/loan_contract_text.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/contact_picker_util.dart';
import 'package:tanjuriel_microfinance/core/utils/currency_formatter.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/utils/validators.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/core/widgets/pin_text_field.dart';
import 'package:tanjuriel_microfinance/core/widgets/top_message_banner.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class ApplyLoanScreen extends ConsumerStatefulWidget {
  const ApplyLoanScreen({super.key});

  @override
  ConsumerState<ApplyLoanScreen> createState() => _ApplyLoanScreenState();
}

class _ApplyLoanScreenState extends ConsumerState<ApplyLoanScreen> {
  static const _stepTitles = [
    'Your details',
    'Loan request',
    'Collateral',
    'Agreement',
    'Review & submit',
  ];

  static const _collateralTypes = [
    ('PROPERTY', 'Property'),
    ('VEHICLE', 'Vehicle'),
    ('EQUIPMENT', 'Equipment'),
    ('CASH', 'Cash / fixed deposit'),
    ('OTHER', 'Other'),
  ];

  final _formKey = GlobalKey<FormState>();
  int _step = 0;

  final _fullName = TextEditingController();
  final _address = TextEditingController();
  final _dob = TextEditingController();
  final _businessInput = TextEditingController();
  final _yearsExp = TextEditingController();
  final _union = TextEditingController();
  final _nokName = TextEditingController();
  final _nokPhone = TextEditingController();
  final _nokAddress = TextEditingController();
  final _amount = TextEditingController();
  final _duration = TextEditingController(text: '6');
  final _purpose = TextEditingController();
  final _collateral = TextEditingController();
  final _collateralValue = TextEditingController();
  final _guarantorName = TextEditingController();
  final _guarantorPhone = TextEditingController();
  final _pin = TextEditingController();

  String _location = 'URBAN';
  String _gender = 'MALE';
  String _education = 'PRIMARY';
  String _marital = 'SINGLE';
  String _loanCategory = 'PERSONAL';
  String _repaymentPlan = 'MONTHLY';
  String _collateralType = 'EQUIPMENT';
  final List<String> _businessActivities = [];
  String? _photoPath;
  bool _contractAccepted = false;
  bool _submitting = false;
  bool _pickingContact = false;
  Map<String, dynamic>? _quote;

  int? get _computedAge {
    if (_dob.text.isEmpty) return null;
    final parsed = DateTime.tryParse(_dob.text.trim());
    if (parsed == null) return null;
    return LoanApplicationOptions.calculateAge(parsed);
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(authProvider).user;
      if (user != null && _fullName.text.isEmpty) {
        _fullName.text = user.fullName;
      }
    });
  }

  @override
  void dispose() {
    TopMessageBanner.hide();
    for (final c in [
      _fullName, _address, _dob, _businessInput, _yearsExp, _union,
      _nokName, _nokPhone, _nokAddress, _amount, _duration, _purpose,
      _collateral, _collateralValue, _guarantorName, _guarantorPhone, _pin,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDob() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(1990, 1, 1),
      firstDate: DateTime(1940),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
    );
    if (picked != null) {
      setState(() => _dob.text = DateFormat('yyyy-MM-dd').format(picked));
    }
  }

  Future<void> _pickPhoto() async {
    final file = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 70);
    if (file != null) setState(() => _photoPath = file.path);
  }

  Future<void> _pickGuarantorContact() async {
    setState(() => _pickingContact = true);
    try {
      final picked = await ContactPickerUtil.pickFromDevice();
      if (picked != null && mounted) {
        setState(() {
          if (picked.name.isNotEmpty) _guarantorName.text = picked.name;
          if (picked.phone.isNotEmpty) {
            _guarantorPhone.text = Validators.normalizePhone(picked.phone);
          }
        });
      }
    } finally {
      if (mounted) setState(() => _pickingContact = false);
    }
  }

  void _addBusinessActivity() {
    final value = _businessInput.text.trim();
    if (value.isEmpty) return;
    setState(() {
      _businessActivities.add(value);
      _businessInput.clear();
    });
  }

  Map<String, double> get _localQuote {
    final principal = double.tryParse(_amount.text) ?? 0;
    final periods = int.tryParse(_duration.text) ?? 0;
    return LoanApplicationOptions.localQuote(
      principal: principal,
      tenurePeriods: periods,
    );
  }

  Future<void> _refreshQuote() async {
    final principal = double.tryParse(_amount.text);
    final periods = int.tryParse(_duration.text);
    if (principal == null || principal <= 0 || periods == null || periods <= 0) {
      setState(() => _quote = null);
      return;
    }
    try {
      final quote = await ref.read(loanRepositoryProvider).quote(
            principalAmount: principal,
            tenurePeriods: periods,
            repaymentPlan: _repaymentPlan,
          );
      if (mounted) setState(() => _quote = quote);
    } catch (_) {
      if (mounted) setState(() => _quote = _localQuote);
    }
  }

  String? _validateStep() {
    switch (_step) {
      case 0:
        if (_fullName.text.trim().isEmpty) return 'Enter your full name';
        if (_address.text.trim().isEmpty) return 'Enter your address';
        if (_dob.text.trim().isEmpty) return 'Select date of birth';
        if (_businessActivities.isEmpty) return 'Add at least one business activity';
        if (_yearsExp.text.trim().isEmpty) return 'Enter years of experience';
        if (_nokName.text.trim().isEmpty) return 'Enter next of kin name';
        final phoneErr = Validators.phone(_nokPhone.text);
        if (phoneErr != null) return phoneErr;
        if (_nokAddress.text.trim().isEmpty) return 'Enter next of kin address';
        return null;
      case 1:
        final amount = double.tryParse(_amount.text);
        if (amount == null || amount <= 0) return 'Enter a valid amount';
        final periods = int.tryParse(_duration.text);
        if (periods == null || periods <= 0) return 'Enter loan duration';
        return null;
      case 2:
        if (_collateral.text.trim().isEmpty) return 'Describe the collateral';
        if (_collateralValue.text.trim().isEmpty) return 'Enter collateral value';
        if (_guarantorName.text.trim().isEmpty) return 'Enter guarantor name';
        final gPhone = Validators.phone(_guarantorPhone.text);
        if (gPhone != null) return gPhone;
        if (_photoPath == null) return 'Attach a collateral photo';
        return null;
      case 3:
        if (!_contractAccepted) return 'You must agree to the contract';
        return null;
      case 4:
        return Validators.pin(_pin.text);
      default:
        return null;
    }
  }

  Future<void> _next() async {
    final error = _validateStep();
    if (error != null) {
      TopMessageBanner.show(context, error);
      return;
    }
    if (_step == 1) await _refreshQuote();
    if (_step < _stepTitles.length - 1) {
      setState(() => _step++);
      if (_step == 4) await _refreshQuote();
    } else {
      await _submit();
    }
  }

  void _handleBack() {
    if (_step > 0) {
      setState(() => _step--);
      return;
    }
    if (context.canPop()) {
      context.pop();
    }
  }

  Future<void> _submit() async {
    final user = ref.read(authProvider).user;
    if (!KycGuard.requireVerified(context, user)) return;

    setState(() => _submitting = true);
    try {
      final loan = await ref.read(loanRepositoryProvider).apply(
            fields: {
              'applicantFullName': _fullName.text.trim(),
              'locationType': _location,
              'applicantAddress': _address.text.trim(),
              'applicantGender': _gender,
              'applicantDateOfBirth': _dob.text.trim(),
              'educationLevel': _education,
              'maritalStatus': _marital,
              'businessActivities': _businessActivities,
              'yearsOfExperience': int.parse(_yearsExp.text.trim()),
              if (_union.text.trim().isNotEmpty) 'unionName': _union.text.trim(),
              'nextOfKinName': _nokName.text.trim(),
              'nextOfKinPhone': Validators.normalizePhone(_nokPhone.text),
              'nextOfKinAddress': _nokAddress.text.trim(),
              'loanCategory': _loanCategory,
              'principalAmount': double.parse(_amount.text.trim()),
              'tenurePeriods': int.parse(_duration.text.trim()),
              'repaymentPlan': _repaymentPlan,
              if (_purpose.text.trim().isNotEmpty) 'purpose': _purpose.text.trim(),
              'collateral': _collateral.text.trim(),
              'collateralType': _collateralType,
              'collateralEstimatedValue': double.parse(_collateralValue.text.trim()),
              'guarantorName': _guarantorName.text.trim(),
              'guarantorPhone': Validators.normalizePhone(_guarantorPhone.text),
            },
            pin: _pin.text.trim(),
            collateralPhotoPath: _photoPath,
          );
      if (!mounted) return;
      context.go(RouteNames.loanSubmitted, extra: loan);
    } catch (e) {
      if (!mounted) return;
      TopMessageBanner.show(context, e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final quote = Map<String, dynamic>.from(_quote ?? _localQuote);
    final principal = double.tryParse(_amount.text) ?? 0;
    final periods = int.tryParse(_duration.text) ?? 0;
    final installment = (quote['installmentAmount'] as num?)?.toDouble() ?? 0;

    final contractText = buildLoanContractText(
      memberName: _fullName.text.trim().isEmpty ? 'Member' : _fullName.text.trim(),
      principalAmount: principal,
      installmentAmount: installment,
      repaymentPlan: _repaymentPlan,
      tenurePeriods: periods,
    );

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Apply for loan'),
          leading: BackButton(onPressed: _handleBack),
        ),
        body: SafeArea(
          child: Form(
            key: _formKey,
            child: Column(
              children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  LinearProgressIndicator(value: (_step + 1) / _stepTitles.length),
                  const SizedBox(height: 8),
                  Text(
                    'Step ${_step + 1} of ${_stepTitles.length}: ${_stepTitles[_step]}',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: AppColors.textDarkBrown,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  if (_step == 0) ..._baselineStep(),
                  if (_step == 1) ..._applicationStep(),
                  if (_step == 2) ..._collateralStep(),
                  if (_step == 3) ..._contractStep(contractText),
                  if (_step == 4) ..._reviewStep(quote),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: Row(
                children: [
                  if (_step > 0)
                    Expanded(
                      child: AppButton(
                        label: 'Back',
                        variant: AppButtonVariant.secondary,
                        onPressed: _handleBack,
                      ),
                    ),
                  if (_step > 0) const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: AppButton(
                      label: _step == _stepTitles.length - 1 ? 'Submit application' : 'Continue',
                      isLoading: _submitting,
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
      ),
    );
  }

  List<Widget> _baselineStep() => [
        AppTextField(controller: _fullName, label: 'Full name', hint: 'As on your ID'),
        const SizedBox(height: 12),
        _dropdown('Location', _location, LoanApplicationOptions.locationTypes,
            LoanApplicationOptions.locationLabel, (v) => setState(() => _location = v)),
        const SizedBox(height: 12),
        AppTextField(controller: _address, label: 'Address', hint: 'Residential address'),
        const SizedBox(height: 12),
        _dropdown('Gender', _gender, LoanApplicationOptions.genders,
            LoanApplicationOptions.genderLabel, (v) => setState(() => _gender = v)),
        const SizedBox(height: 12),
        Material(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: _pickDob,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Date of birth', style: Theme.of(context).textTheme.labelMedium),
                        Text(
                          _dob.text.isEmpty ? 'Tap to select' : '${_dob.text}${_computedAge != null ? ' · Age $_computedAge' : ''}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const Text('Select', style: TextStyle(color: AppColors.primary)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        _dropdown('Level of education', _education, LoanApplicationOptions.educationLevels,
            LoanApplicationOptions.educationLabel, (v) => setState(() => _education = v)),
        const SizedBox(height: 12),
        _dropdown('Marital status', _marital, LoanApplicationOptions.maritalStatuses,
            LoanApplicationOptions.maritalLabel, (v) => setState(() => _marital = v)),
        const SizedBox(height: 16),
        Text('Business activity', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: AppTextField(
                controller: _businessInput,
                label: 'Type',
                hint: 'e.g. Trading, Tailoring',
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(onPressed: _addBusinessActivity, icon: const Icon(Icons.add)),
          ],
        ),
        if (_businessActivities.isNotEmpty)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _businessActivities
                .map((a) => Chip(
                      label: Text(a),
                      onDeleted: () => setState(() => _businessActivities.remove(a)),
                    ))
                .toList(),
          ),
        const SizedBox(height: 12),
        AppTextField(controller: _yearsExp, label: 'Years of experience', keyboardType: TextInputType.number),
        const SizedBox(height: 12),
        AppTextField(controller: _union, label: 'Union (if applicable)', hint: 'Optional'),
        const SizedBox(height: 20),
        Text('Next of kin', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        AppTextField(controller: _nokName, label: 'Name'),
        const SizedBox(height: 12),
        AppTextField(controller: _nokPhone, label: 'Phone', keyboardType: TextInputType.phone),
        const SizedBox(height: 12),
        AppTextField(controller: _nokAddress, label: 'Address'),
      ];

  List<Widget> _applicationStep() {
    final principal = double.tryParse(_amount.text) ?? 0;
    final periods = int.tryParse(_duration.text) ?? 0;
    return [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.amber.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.amber.shade200),
          ),
          child: Text(
            'Notice: loan account opening cost ${CurrencyFormatter.format(LoanApplicationOptions.openingFee.toDouble())}',
            style: TextStyle(color: Colors.amber.shade900, fontWeight: FontWeight.w600),
          ),
        ),
        const SizedBox(height: 16),
        AppTextField(
          controller: _amount,
          label: 'Amount requested (NGN)',
          keyboardType: TextInputType.number,
          onChanged: (_) => _refreshQuote(),
        ),
        const SizedBox(height: 12),
        _dropdown('Loan type', _loanCategory, LoanApplicationOptions.loanCategories,
            LoanApplicationOptions.loanCategoryLabel, (v) => setState(() => _loanCategory = v)),
        const SizedBox(height: 12),
        AppTextField(
          controller: _duration,
          label: 'Loan duration (${LoanApplicationOptions.repaymentPeriodUnit(_repaymentPlan)})',
          keyboardType: TextInputType.number,
          onChanged: (_) => _refreshQuote(),
        ),
        const SizedBox(height: 12),
        _dropdown('Repayment plan', _repaymentPlan, LoanApplicationOptions.repaymentPlans,
            LoanApplicationOptions.repaymentPlanLabel, (v) {
          setState(() => _repaymentPlan = v);
          _refreshQuote();
        }),
        const SizedBox(height: 12),
        AppTextField(controller: _purpose, label: 'Purpose (optional)', hint: 'What will you use the loan for?'),
        if (principal > 0 && periods > 0) ...[
          const SizedBox(height: 20),
          _quoteCard(_localQuote, principal, periods),
        ],
      ];
  }

  List<Widget> _collateralStep() => [
        _dropdown('Collateral type', _collateralType, _collateralTypes.map((e) => e.$1).toList(),
            (v) => _collateralTypes.firstWhere((e) => e.$1 == v).$2, (v) => setState(() => _collateralType = v)),
        const SizedBox(height: 12),
        AppTextField(controller: _collateral, label: 'Collateral description'),
        const SizedBox(height: 12),
        AppTextField(
          controller: _collateralValue,
          label: 'Estimated value (NGN)',
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: _pickPhoto,
          icon: const Icon(Icons.camera_alt_outlined),
          label: Text(_photoPath == null ? 'Attach collateral photo' : 'Photo attached — change'),
        ),
        if (_photoPath != null) ...[
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.file(File(_photoPath!), height: 120, fit: BoxFit.cover),
          ),
        ],
        const SizedBox(height: 20),
        Text('Guarantor', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        AppTextField(controller: _guarantorName, label: 'Guarantor name'),
        const SizedBox(height: 12),
        AppTextField(controller: _guarantorPhone, label: 'Guarantor phone', keyboardType: TextInputType.phone),
        const SizedBox(height: 8),
        TextButton.icon(
          onPressed: _pickingContact ? null : _pickGuarantorContact,
          icon: const Icon(Icons.contacts_outlined),
          label: Text(_pickingContact ? 'Opening contacts…' : 'Pick from contacts'),
        ),
      ];

  List<Widget> _contractStep(String contractText) => [
        Text('Contact agreement', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Container(
          height: 320,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(12),
            color: AppColors.surface,
          ),
          child: SingleChildScrollView(
            child: Text(contractText, style: Theme.of(context).textTheme.bodySmall),
          ),
        ),
        const SizedBox(height: 12),
        CheckboxListTile(
          value: _contractAccepted,
          onChanged: (v) => setState(() => _contractAccepted = v ?? false),
          title: const Text('I have read and agree to the contact agreement'),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
        ),
      ];

  List<Widget> _reviewStep(Map<String, dynamic> quote) {
    final principal = double.tryParse(_amount.text) ?? 0;
    final periods = int.tryParse(_duration.text) ?? 0;
    return [
      Text('Confirm your application', style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 12),
      _summaryRow('Name', _fullName.text),
      _summaryRow('Loan type', LoanApplicationOptions.loanCategoryLabel(_loanCategory)),
      _summaryRow('Amount', CurrencyFormatter.format(principal)),
      _summaryRow('Duration', '$periods ${LoanApplicationOptions.repaymentPeriodUnit(_repaymentPlan)}'),
      _summaryRow('Repayment', LoanApplicationOptions.repaymentPlanLabel(_repaymentPlan)),
      const SizedBox(height: 16),
      _quoteCard(quote, principal, periods),
      const SizedBox(height: 20),
      PinTextField(controller: _pin, label: 'Transaction PIN'),
    ];
  }

  Widget _quoteCard(Map<String, dynamic> quote, double principal, int periods) {
    final installment = (quote['installmentAmount'] as num?)?.toDouble() ?? 0;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Repayment summary', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          _summaryRow('Opening fee', CurrencyFormatter.format((quote['openingFee'] as num?)?.toDouble() ?? 1000)),
          _summaryRow('Upfront fee (10%)', CurrencyFormatter.format((quote['upfrontFee'] as num?)?.toDouble() ?? 0)),
          _summaryRow('Interest (10%)', CurrencyFormatter.format((quote['flatInterestAmount'] as num?)?.toDouble() ?? 0)),
          _summaryRow('Total repayable', CurrencyFormatter.format((quote['totalRepayable'] as num?)?.toDouble() ?? 0)),
          _summaryRow('Net disbursement', CurrencyFormatter.format((quote['netDisbursement'] as num?)?.toDouble() ?? 0)),
          const Divider(height: 20),
          Text(
            '${CurrencyFormatter.format(installment)} per ${LoanApplicationOptions.repaymentPlanLabel(_repaymentPlan).toLowerCase()} × $periods',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppColors.primary),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 120, child: Text(label, style: const TextStyle(color: AppColors.textBrownMuted))),
            Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
          ],
        ),
      );

  Widget _dropdown(
    String label,
    String value,
    List<String> options,
    String Function(String) labelFor,
    ValueChanged<String> onChanged,
  ) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(labelText: label, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
      items: options.map((o) => DropdownMenuItem(value: o, child: Text(labelFor(o)))).toList(),
      onChanged: (v) {
        if (v != null) onChanged(v);
      },
    );
  }
}
