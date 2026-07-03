import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';

class Validators {
  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) return 'Email is required';
    final regex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!regex.hasMatch(value.trim())) return 'Enter a valid email address';
    return null;
  }

  static String cleanPhone(String value) {
    return value.replaceAll(RegExp(r'[\s\-().]'), '');
  }

  /// Normalizes Nigerian numbers to 11-digit local format (080…).
  static String normalizePhone(String value) {
    var cleaned = cleanPhone(value);
    if (cleaned.startsWith('+234')) cleaned = '0${cleaned.substring(4)}';
    if (cleaned.startsWith('234') && cleaned.length >= 13) cleaned = '0${cleaned.substring(3)}';
    if (!cleaned.startsWith('0') && cleaned.length == 10) cleaned = '0$cleaned';
    return cleaned;
  }

  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) return 'Phone number is required';
    final cleaned = normalizePhone(value);
    if (!RegExp(r'^0[789][01]\d{8}$').hasMatch(cleaned)) {
      return 'Enter a valid Nigerian number (070, 080, 081, 090, 091)';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!RegExp(r'[A-Z]').hasMatch(value)) return 'Include at least one uppercase letter';
    if (!RegExp(r'[0-9]').hasMatch(value)) return 'Include at least one number';
    return null;
  }

  static String? confirmPassword(String? value, String password) {
    if (value != password) return 'Passwords do not match';
    return null;
  }

  static String? pin(String? value) {
    if (value == null || value.isEmpty) return 'PIN is required';
    if (value.length != AppConstants.pinLength) {
      return 'PIN must be ${AppConstants.pinLength} digits';
    }
    if (!RegExp(r'^\d+$').hasMatch(value)) return 'PIN must contain only numbers';
    return null;
  }

  static String? bvn(String? value) {
    if (value == null || value.isEmpty) return 'BVN is required';
    if (value.length != AppConstants.bvnLength) {
      return 'BVN must be ${AppConstants.bvnLength} digits';
    }
    if (!RegExp(r'^\d+$').hasMatch(value)) return 'BVN must contain only numbers';
    return null;
  }

  static String? nin(String? value) {
    if (value == null || value.isEmpty) return 'NIN is required';
    if (value.length != AppConstants.ninLength) {
      return 'NIN must be ${AppConstants.ninLength} digits';
    }
    if (!RegExp(r'^\d+$').hasMatch(value)) return 'NIN must contain only numbers';
    return null;
  }

  static String? amount(String? value, {double? min, double? max}) {
    if (value == null || value.trim().isEmpty) return 'Amount is required';
    final parsed = double.tryParse(value.replaceAll(',', ''));
    if (parsed == null || parsed <= 0) return 'Enter a valid amount';
    if (min != null && parsed < min) return 'Minimum amount is ₦${min.toStringAsFixed(0)}';
    if (max != null && parsed > max) return 'Maximum amount is ₦${max.toStringAsFixed(0)}';
    return null;
  }

  static String? accountNumber(String? value) {
    if (value == null || value.isEmpty) return 'Account number is required';
    if (!RegExp(r'^\d{10}$').hasMatch(value)) return 'Account number must be 10 digits';
    return null;
  }

  static String? required(String? value, {String field = 'This field'}) {
    if (value == null || value.trim().isEmpty) return '$field is required';
    return null;
  }
}
