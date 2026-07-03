class ApiEndpoints {
  // Base URL comes from AppConfig.apiBaseUrl (--dart-define=API_BASE_URL=...).
  // Android emulator default: http://10.0.2.2:4000/api/v1
  // Physical device: http://YOUR_PC_LAN_IP:4000/api/v1

  // Customer auth
  static const String customerLogin = '/customer/auth/login';
  static const String customerRefresh = '/customer/auth/refresh';
  static const String customerLogout = '/customer/auth/logout';
  static const String customerChangePin = '/customer/auth/change-pin';

  // Customer app
  static const String customerMe = '/customer/me';
  static const String settlementAccounts = '/customer/settlement-accounts';
  static const String depositRequests = '/customer/deposit-requests';
  static const String transferRequests = '/customer/transfer-requests';
  static const String paymentRequests = '/customer/payment-requests';
  static const String customerTransactions = '/customer/transactions';
  static const String notifications = '/customer/notifications';
  static const String notificationsUnread = '/customer/notifications/unread-count';

  static const String loanProducts = '/customer/loan-products';
  static const String customerLoans = '/customer/loans';
  static const String applyLoan = '/customer/loans/apply';

  // Legacy paths (unused in manual ops mode)
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String verifyOtp = '/auth/verify-otp';
  static const String refreshToken = '/auth/refresh';
  static const String kycStatus = '/kyc/status';
  static const String bankList = '/nibss/banks';
  static const String transactions = '/customer/transactions';
}
