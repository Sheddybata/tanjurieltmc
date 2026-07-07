import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:tanjuriel_microfinance/core/constants/contribution_frequency.dart';
import 'package:tanjuriel_microfinance/core/errors/app_exception.dart';
import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';
import 'package:tanjuriel_microfinance/core/utils/kyc_guard.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_button.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_text_field.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/providers/member_accounts_provider.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

class OpenAccountScreen extends ConsumerStatefulWidget {
  const OpenAccountScreen({super.key});

  @override
  ConsumerState<OpenAccountScreen> createState() => _OpenAccountScreenState();
}

class _OpenAccountScreenState extends ConsumerState<OpenAccountScreen> {
  String? _type;
  String? _frequency;
  final _labelController = TextEditingController();
  final _fatherController = TextEditingController();
  final _motherController = TextEditingController();
  final _schoolController = TextEditingController();
  DateTime? _maturityDate;
  DateTime? _dateOfBirth;
  String? _photoPath;
  bool _submitting = false;

  @override
  void dispose() {
    _labelController.dispose();
    _fatherController.dispose();
    _motherController.dispose();
    _schoolController.dispose();
    super.dispose();
  }

  bool get _isChildSavings => _type == 'MY_PIKIN';
  bool get _hasAccountType => _type != null;

  void _selectType(String type) {
    setState(() {
      _type = type;
      _frequency = null;
      _maturityDate = null;
      _dateOfBirth = null;
      _photoPath = null;
      _labelController.clear();
      _fatherController.clear();
      _motherController.clear();
      _schoolController.clear();
    });
  }

  Future<void> _pickMaturityDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 365)),
      firstDate: DateTime.now().add(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 18)),
    );
    if (picked != null) setState(() => _maturityDate = picked);
  }

  Future<void> _pickDateOfBirth() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365 * 5)),
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
      lastDate: DateTime.now().subtract(const Duration(days: 1)),
    );
    if (picked != null) setState(() => _dateOfBirth = picked);
  }

  Future<void> _pickPhoto(ImageSource source) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: source, imageQuality: 70);
    if (file != null) setState(() => _photoPath = file.path);
  }

  Future<void> _showPhotoOptions() async {
    await showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Take photo'),
              onTap: () {
                Navigator.pop(ctx);
                _pickPhoto(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from gallery'),
              onTap: () {
                Navigator.pop(ctx);
                _pickPhoto(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) => date.toLocal().toString().split(' ').first;

  String _friendlyError(Object error) {
    final inner = error is DioException ? error.error : error;
    if (inner is NetworkException) {
      if (inner.code == '404') {
        return 'Open account is not available on the server yet. '
            'Deploy the latest API, then try again.';
      }
      return inner.message;
    }
    return error.toString().replaceFirst('Exception: ', '');
  }

  Future<void> _submit() async {
    final user = ref.read(authProvider).user;
    if (!KycGuard.requireVerified(context, user)) return;

    if (_type == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select an account type')),
      );
      return;
    }
    if (_frequency == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a contribution frequency')),
      );
      return;
    }

    if (_isChildSavings) {
      if (_labelController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Enter the child's full name")),
        );
        return;
      }
      if (_dateOfBirth == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Select the child's date of birth")),
        );
        return;
      }
      if (_schoolController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enter current school')),
        );
        return;
      }
      if (_fatherController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Enter father's name")),
        );
        return;
      }
      if (_motherController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Enter mother's name")),
        );
        return;
      }
      if (_maturityDate == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Select a maturity date')),
        );
        return;
      }
      if (_photoPath == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('A photo of the child is required')),
        );
        return;
      }
    }

    setState(() => _submitting = true);
    try {
      final api = ref.read(apiClientProvider);
      final Map<String, dynamic> payload = {
        'type': _type,
        'contributionFrequency': _frequency,
        if (_isChildSavings) ...{
          'label': _labelController.text.trim(),
          'maturityDate': _formatDate(_maturityDate!),
          'childDateOfBirth': _formatDate(_dateOfBirth!),
          'childSchool': _schoolController.text.trim(),
          'fatherName': _fatherController.text.trim(),
          'motherName': _motherController.text.trim(),
        },
      };

      final Response<Map<String, dynamic>> res;
      if (_isChildSavings && _photoPath != null) {
        final form = FormData.fromMap({
          ...payload,
          'childPhoto': await MultipartFile.fromFile(_photoPath!, filename: 'child.jpg'),
        });
        res = await api.post<Map<String, dynamic>>('/customer/accounts', data: form);
      } else {
        res = await api.post<Map<String, dynamic>>('/customer/accounts', data: payload);
      }

      final account = res.data?['data'] as Map<String, dynamic>?;
      final accountNumber = account?['accountNumber'] as String? ?? '';

      final data = await ref.read(accountRepositoryProvider).getDashboardData(forceRefresh: true);
      setMemberAccounts(ref, data.accounts);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            accountNumber.isNotEmpty
                ? 'Account opened — member ID $accountNumber'
                : 'Account opened successfully',
          ),
        ),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_friendlyError(e))),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final accounts = ref.watch(memberAccountsProvider);
    final hasDaily = accounts.any((a) => a.type == 'DAILY_SAVINGS');
    final dailyDisabled = hasDaily;
    final canSubmit = _hasAccountType &&
        _frequency != null &&
        !(_type == 'DAILY_SAVINGS' && dailyDisabled);

    return Scaffold(
      appBar: AppBar(title: const Text('Open account')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text(
            'Choose an account type and how often you plan to save.',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textDarkBrown,
                ),
          ),
          const SizedBox(height: 20),
          _AccountTypeCard(
            title: 'Daily Savings',
            subtitle: 'Flexible savings on your own schedule',
            accent: AppColors.primary,
            selected: _type == 'DAILY_SAVINGS',
            disabled: dailyDisabled,
            disabledHint: dailyDisabled ? 'You already have a Daily Savings account' : null,
            onTap: dailyDisabled ? null : () => _selectType('DAILY_SAVINGS'),
          ),
          const SizedBox(height: 12),
          _AccountTypeCard(
            title: 'Child Savings',
            subtitle: 'Dedicated savings for your child — you can open more than one',
            accent: AppColors.primary,
            selected: _type == 'MY_PIKIN',
            onTap: () => _selectType('MY_PIKIN'),
          ),
          if (_hasAccountType) ...[
            const SizedBox(height: 28),
            Text(
              'Contribution frequency',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppColors.textDarkBrown,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              'How often do you plan to add money to this account?',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textBrownMuted),
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.45,
              children: ContributionFrequency.all.map((freq) {
                return _FrequencyTile(
                  label: ContributionFrequency.label(freq),
                  description: ContributionFrequency.description(freq),
                  selected: _frequency == freq,
                  onTap: () => setState(() => _frequency = freq),
                );
              }).toList(),
            ),
          ] else ...[
            const SizedBox(height: 28),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(
                'Select Daily Savings or Child Savings above to choose your contribution frequency.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textBrownMuted),
              ),
            ),
          ],
          if (_isChildSavings) ...[
            const SizedBox(height: 28),
            Text(
              'Child details',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppColors.textDarkBrown,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  AppTextField(
                    controller: _labelController,
                    label: "Child's full name",
                    hint: 'e.g. Ada Eze',
                  ),
                  const SizedBox(height: 12),
                  _DatePickerRow(
                    label: 'Date of birth',
                    hint: 'Tap to select',
                    value: _dateOfBirth == null ? null : _formatDate(_dateOfBirth!),
                    onTap: _pickDateOfBirth,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: _schoolController,
                    label: 'Current school',
                    hint: 'e.g. St. Mary Primary School',
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: _fatherController,
                    label: "Father's name",
                    hint: 'e.g. John Eze',
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: _motherController,
                    label: "Mother's name",
                    hint: 'e.g. Mary Eze',
                  ),
                  const SizedBox(height: 12),
                  _DatePickerRow(
                    label: 'Maturity date',
                    hint: 'Tap to select — withdrawals after this date',
                    value: _maturityDate == null ? null : _formatDate(_maturityDate!),
                    onTap: _pickMaturityDate,
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: _showPhotoOptions,
                    icon: const Icon(Icons.camera_alt_outlined),
                    label: Text(
                      _photoPath == null ? 'Child photo (required)' : 'Photo attached — change',
                    ),
                  ),
                  if (_photoPath != null) ...[
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(File(_photoPath!), height: 120, fit: BoxFit.cover),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'After maturity, request withdrawal on mobile. Manager approves before cash is paid at branch.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textBrownMuted),
            ),
          ],
          const SizedBox(height: 28),
          AppButton(
            label: 'Open account',
            isLoading: _submitting,
            onPressed: canSubmit ? _submit : null,
          ),
        ],
      ),
    );
  }
}

class _DatePickerRow extends StatelessWidget {
  const _DatePickerRow({
    required this.label,
    required this.hint,
    required this.onTap,
    this.value,
  });

  final String label;
  final String hint;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceVariant,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: AppColors.textDarkBrown,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      value ?? hint,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: value == null ? AppColors.textBrownMuted : AppColors.textDarkBrown,
                          ),
                    ),
                  ],
                ),
              ),
              Text(
                'Select',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: AppColors.primary,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AccountTypeCard extends StatelessWidget {
  const _AccountTypeCard({
    required this.title,
    required this.subtitle,
    required this.accent,
    required this.selected,
    this.disabled = false,
    this.disabledHint,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final Color accent;
  final bool selected;
  final bool disabled;
  final String? disabledHint;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final borderColor = selected ? accent : AppColors.border;
    final opacity = disabled ? 0.55 : 1.0;

    return Opacity(
      opacity: opacity,
      child: Material(
        color: selected ? accent.withValues(alpha: 0.06) : AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: borderColor, width: selected ? 2 : 1),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: selected ? AppColors.primary : AppColors.textDarkBrown,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  disabledHint ?? subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: disabled ? AppColors.warning : AppColors.textBrownMuted,
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FrequencyTile extends StatelessWidget {
  const _FrequencyTile({
    required this.label,
    required this.description,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String description;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.primary.withValues(alpha: 0.08) : AppColors.surface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: selected ? AppColors.primary : AppColors.textDarkBrown,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textBrownMuted,
                      fontSize: 11,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
