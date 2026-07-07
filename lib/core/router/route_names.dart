abstract final class RouteNames {
  static const splash = '/';
  static const welcome = '/welcome';
  static const register = '/register';
  static const login = '/login';
  static const otpVerification = '/otp-verification';

  static const kycIntro = '/kyc';
  static const bvnVerification = '/kyc/bvn';
  static const ninVerification = '/kyc/nin';
  static const faceCapture = '/kyc/face-capture';
  static const kycStatus = '/kyc/status';

  static const fundAccount = '/fund-account';
  static const notifications = '/notifications';
  static const loans = '/loans';
  static const applyLoan = '/loans/apply';
  static const loanSubmitted = '/loans/submitted';
  static const loanDetail = '/loans/:id';
  static const home = '/home';
  static const savings = '/savings';
  static const openAccount = '/savings/open';
  static const requestWithdrawal = '/savings/withdraw';
  static const transfer = '/transfer';
  static const transferConfirm = '/transfer/confirm';
  static const transferSuccess = '/transfer/success';
  static const transactions = '/transactions';
  static const transactionDetail = '/transactions/:id';
  static const profile = '/profile';
  static const securitySettings = '/profile/security';
  static const changePassword = '/profile/change-password';
  static const changePin = '/profile/change-pin';
  static const accountDetails = '/profile/account-details';
  static const helpCenter = '/profile/help';
  static const termsPrivacy = '/profile/terms';
}
