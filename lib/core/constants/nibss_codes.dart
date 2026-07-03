/// NIBSS NIP response code mappings for transfer operations.
abstract final class NibssResponseCodes {
  static const String approved = '00';
  static const String invalidAccount = '07';
  static const String insufficientFunds = '51';
  static const String duplicateTransaction = '94';
  static const String systemMalfunction = '96';
  static const String timeout = '97';

  static String message(String code) => switch (code) {
        approved => 'Approved or completed successfully',
        invalidAccount => 'Invalid account number',
        insufficientFunds => 'Insufficient funds',
        duplicateTransaction => 'Duplicate transaction detected',
        systemMalfunction => 'System malfunction, please try again',
        timeout => 'Transaction timeout, check status before retrying',
        _ => 'Transaction could not be completed (Code: $code)',
      };

  static bool isRetryable(String code) =>
      code == systemMalfunction || code == timeout;
}
