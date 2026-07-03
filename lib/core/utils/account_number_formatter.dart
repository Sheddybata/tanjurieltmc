/// Formats customer account numbers as 10-digit numeric strings for display.
class AccountNumberFormatter {
  AccountNumberFormatter._();

  static String display(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return raw;
    if (digits.length >= 10) return digits.substring(digits.length - 10);
    return digits.padLeft(10, '0');
  }
}

/// Human-readable labels for backend [AccountType] values.
class AccountTypeLabels {
  AccountTypeLabels._();

  static String fromApi(String? type) {
    return switch (type) {
      'SAVINGS' => 'Savings account',
      'CURRENT' => 'Current account',
      'FIXED_DEPOSIT' => 'Fixed deposit',
      'LOAN' => 'Loan account',
      'MY_PIKIN' => 'My Pikin (kids savings)',
      'DAILY_SAVINGS' => 'Daily savings',
      _ => 'Savings account',
    };
  }
}
