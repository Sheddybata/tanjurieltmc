import 'dart:io';



import 'package:flutter/material.dart';

import 'package:flutter/services.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import 'package:image_picker/image_picker.dart';

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

import 'package:tanjuriel_microfinance/shared/models/loan_model.dart';

import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';



class ApplyLoanScreen extends ConsumerStatefulWidget {

  const ApplyLoanScreen({super.key});



  @override

  ConsumerState<ApplyLoanScreen> createState() => _ApplyLoanScreenState();

}



class _ApplyLoanScreenState extends ConsumerState<ApplyLoanScreen> {

  final _formKey = GlobalKey<FormState>();

  final _amountController = TextEditingController();

  final _tenureController = TextEditingController(text: '6');

  final _purposeController = TextEditingController();

  final _collateralController = TextEditingController();

  final _collateralValueController = TextEditingController();

  final _guarantorNameController = TextEditingController();

  final _guarantorPhoneController = TextEditingController();

  final _pinController = TextEditingController();



  List<LoanProductModel> _products = [];

  LoanProductModel? _selectedProduct;

  String _collateralType = 'EQUIPMENT';

  String? _photoPath;

  bool _loadingProducts = true;

  bool _submitting = false;

  bool _pickingContact = false;



  static const _collateralTypes = [

    ('PROPERTY', 'Property'),

    ('VEHICLE', 'Vehicle'),

    ('EQUIPMENT', 'Equipment'),

    ('CASH', 'Cash / fixed deposit'),

    ('OTHER', 'Other'),

  ];



  @override

  void initState() {

    super.initState();

    _loadProducts();

  }



  @override
  void dispose() {
    TopMessageBanner.hide();
    _amountController.dispose();

    _tenureController.dispose();

    _purposeController.dispose();

    _collateralController.dispose();

    _collateralValueController.dispose();

    _guarantorNameController.dispose();

    _guarantorPhoneController.dispose();

    _pinController.dispose();

    super.dispose();

  }



  Future<void> _loadProducts() async {

    try {

      final products = await ref.read(loanRepositoryProvider).getProducts();

      if (mounted) {

        setState(() {

          _products = products;

          _selectedProduct = products.isNotEmpty ? products.first : null;

          _loadingProducts = false;

        });

      }

    } catch (e) {
      if (mounted) {
        setState(() => _loadingProducts = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not load loan products: $e')),
        );
      }
    }

  }



  Future<void> _pickPhoto() async {

    final picker = ImagePicker();

    final file = await picker.pickImage(source: ImageSource.camera, imageQuality: 70);

    if (file != null) setState(() => _photoPath = file.path);

  }



  Future<void> _pickGuarantorFromContacts() async {

    setState(() => _pickingContact = true);

    try {

      final picked = await ContactPickerUtil.pickFromDevice();

      if (!mounted) return;

      if (picked == null) {

        ScaffoldMessenger.of(context).showSnackBar(

          const SnackBar(content: Text('No contact selected. You can enter guarantor details manually.')),

        );

        return;

      }

      setState(() {
        if (picked.name.isNotEmpty) _guarantorNameController.text = picked.name;
        if (picked.phone.isNotEmpty) {
          _guarantorPhoneController.text = Validators.normalizePhone(picked.phone);
        }
      });

    } catch (_) {

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(

        const SnackBar(content: Text('Could not open contacts. Enter guarantor details manually.')),

      );

    } finally {

      if (mounted) setState(() => _pickingContact = false);

    }

  }



  String? _firstValidationError() {
    final product = _selectedProduct;
    final needsCollateral = product?.requiresCollateral ?? true;

    if (_amountController.text.isEmpty) return 'Enter amount';
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) return 'Enter a valid amount';
    if (product != null && (amount < product.minAmount || amount > product.maxAmount)) {
      return 'Amount must be between ${CurrencyFormatter.format(product.minAmount)} and ${CurrencyFormatter.format(product.maxAmount)}';
    }

    final tenureText = _tenureController.text;
    if (tenureText.isEmpty) return 'Enter tenure';
    final months = int.tryParse(tenureText);
    if (months == null || months <= 0) return 'Enter valid months';
    if (product != null && (months < product.minTenureMonths || months > product.maxTenureMonths)) {
      return 'Tenure must be ${product.minTenureMonths}–${product.maxTenureMonths} months';
    }

    if (needsCollateral) {
      if (_collateralController.text.trim().isEmpty) return 'Describe the collateral';
      if (_collateralValueController.text.isEmpty) return 'Enter estimated value';
      if (_guarantorNameController.text.trim().isEmpty) return 'Enter guarantor name';
      final phoneError = Validators.phone(_guarantorPhoneController.text);
      if (phoneError != null) return phoneError;
    }

    return Validators.pin(_pinController.text);
  }

  Future<void> _submit() async {
    final user = ref.read(authProvider).user;
    if (!KycGuard.requireVerified(context, user)) return;
    if (_selectedProduct == null) {
      TopMessageBanner.show(context, 'Select a loan product');
      return;
    }

    final validationError = _firstValidationError();
    if (validationError != null) {
      _formKey.currentState!.validate();
      TopMessageBanner.show(context, validationError);
      return;
    }

    final product = _selectedProduct!;
    if (product.requiresCollateral && _photoPath == null) {
      TopMessageBanner.show(context, 'Please attach a photo of the collateral');
      return;
    }

    setState(() => _submitting = true);
    try {
      final loan = await ref.read(loanRepositoryProvider).apply(
            productId: product.id,
            principalAmount: double.parse(_amountController.text),
            tenureMonths: int.parse(_tenureController.text),
            purpose: _purposeController.text.trim(),
            pin: _pinController.text.trim(),
            collateral: _collateralController.text.trim(),
            collateralType: _collateralType,
            collateralEstimatedValue: double.parse(_collateralValueController.text),
            guarantorName: _guarantorNameController.text.trim(),
            guarantorPhone: Validators.normalizePhone(_guarantorPhoneController.text.trim()),
            collateralPhotoPath: _photoPath,
          );
      if (!mounted) return;
      context.push(RouteNames.loanSubmitted, extra: loan);
    } catch (e) {
      if (!mounted) return;
      TopMessageBanner.show(context, e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }



  @override

  Widget build(BuildContext context) {

    final product = _selectedProduct;

    final needsCollateral = product?.requiresCollateral ?? true;



    return Scaffold(

      appBar: AppBar(title: const Text('Apply for Loan')),

      body: _loadingProducts

          ? const Center(child: CircularProgressIndicator())

          : _products.isEmpty

              ? const Center(child: Text('No loan products available'))

              : SingleChildScrollView(

                  padding: const EdgeInsets.all(24),

                  child: Form(

                    key: _formKey,

                    child: Column(

                      crossAxisAlignment: CrossAxisAlignment.start,

                      children: [

                        Text('Choose a product', style: Theme.of(context).textTheme.titleMedium),

                        const SizedBox(height: 12),

                        ..._products.map(

                          (p) => RadioListTile<LoanProductModel>(

                            value: p,

                            groupValue: _selectedProduct,

                            onChanged: (v) => setState(() => _selectedProduct = v),

                            title: Text(p.name),

                            subtitle: Text(

                              '${CurrencyFormatter.formatCompact(p.minAmount)} – ${CurrencyFormatter.formatCompact(p.maxAmount)} · Collateral required',

                            ),

                            contentPadding: EdgeInsets.zero,

                          ),

                        ),

                        const SizedBox(height: 24),

                        AppTextField(

                          controller: _amountController,

                          label: 'Loan amount',

                          keyboardType: TextInputType.number,

                          inputFormatters: [FilteringTextInputFormatter.digitsOnly],

                          validator: (v) {

                            if (v == null || v.isEmpty) return 'Enter amount';

                            final amount = double.tryParse(v);

                            if (amount == null || amount <= 0) return 'Enter a valid amount';

                            if (product != null && (amount < product.minAmount || amount > product.maxAmount)) {

                              return 'Amount must be between ${CurrencyFormatter.format(product.minAmount)} and ${CurrencyFormatter.format(product.maxAmount)}';

                            }

                            return null;

                          },

                        ),

                        const SizedBox(height: 16),

                        AppTextField(

                          controller: _tenureController,

                          label: 'Tenure (months)',

                          keyboardType: TextInputType.number,

                          inputFormatters: [FilteringTextInputFormatter.digitsOnly],

                          validator: (v) {

                            if (v == null || v.isEmpty) return 'Enter tenure';

                            final months = int.tryParse(v);

                            if (months == null || months <= 0) return 'Enter valid months';

                            if (product != null && (months < product.minTenureMonths || months > product.maxTenureMonths)) {

                              return 'Tenure must be ${product.minTenureMonths}–${product.maxTenureMonths} months';

                            }

                            return null;

                          },

                        ),

                        const SizedBox(height: 16),

                        AppTextField(controller: _purposeController, label: 'Purpose (optional)'),

                        if (needsCollateral) ...[

                          const SizedBox(height: 24),

                          Text('Collateral (required)', style: Theme.of(context).textTheme.titleMedium),

                          const SizedBox(height: 12),

                          DropdownButtonFormField<String>(

                            value: _collateralType,

                            decoration: const InputDecoration(labelText: 'Collateral type'),

                            items: _collateralTypes

                                .map((e) => DropdownMenuItem(value: e.$1, child: Text(e.$2)))

                                .toList(),

                            onChanged: (v) => setState(() => _collateralType = v ?? 'EQUIPMENT'),

                          ),

                          const SizedBox(height: 12),

                          AppTextField(

                            controller: _collateralController,

                            label: 'Description',

                            validator: (v) => needsCollateral && (v == null || v.trim().isEmpty) ? 'Describe the collateral' : null,

                          ),

                          const SizedBox(height: 12),

                          AppTextField(

                            controller: _collateralValueController,

                            label: 'Estimated value (₦)',

                            keyboardType: TextInputType.number,

                            inputFormatters: [FilteringTextInputFormatter.digitsOnly],

                            validator: (v) => needsCollateral && (v == null || v.isEmpty) ? 'Enter estimated value' : null,

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

                          const SizedBox(height: 24),

                          Text('Guarantor (required)', style: Theme.of(context).textTheme.titleMedium),

                          const SizedBox(height: 8),

                          Text(

                            'Pick someone from your phone contacts or enter their details manually.',

                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),

                          ),

                          const SizedBox(height: 12),

                          OutlinedButton.icon(

                            onPressed: _pickingContact ? null : _pickGuarantorFromContacts,

                            icon: _pickingContact

                                ? const SizedBox(

                                    width: 18,

                                    height: 18,

                                    child: CircularProgressIndicator(strokeWidth: 2),

                                  )

                                : const Icon(Icons.contacts_outlined),

                            label: const Text('Choose from contacts'),

                          ),

                          const SizedBox(height: 12),

                          AppTextField(

                            controller: _guarantorNameController,

                            label: 'Guarantor full name',

                            validator: (v) => needsCollateral && (v == null || v.trim().isEmpty) ? 'Enter guarantor name' : null,

                          ),

                          const SizedBox(height: 12),

                          AppTextField(
                            controller: _guarantorPhoneController,
                            label: 'Guarantor phone',
                            hint: 'e.g. 08012345678',
                            keyboardType: TextInputType.phone,
                            validator: (v) {
                              if (!needsCollateral) return null;
                              return Validators.phone(v);
                            },
                          ),

                        ],

                        const SizedBox(height: 16),

                        PinTextField(

                          controller: _pinController,

                          label: 'Transaction PIN',

                          validator: Validators.pin,

                        ),

                        const SizedBox(height: 32),

                        AppButton(label: 'Submit application', isLoading: _submitting, onPressed: _submit),

                      ],

                    ),

                  ),

                ),

    );

  }

}


