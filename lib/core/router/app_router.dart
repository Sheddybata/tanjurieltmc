import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';
import 'package:tanjuriel_microfinance/core/router/router_refresh_notifier.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/screens/login_screen.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/screens/otp_verification_screen.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/screens/register_screen.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/screens/splash_screen.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/screens/welcome_screen.dart';
import 'package:tanjuriel_microfinance/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:tanjuriel_microfinance/features/dashboard/presentation/screens/fund_account_screen.dart';
import 'package:tanjuriel_microfinance/features/notifications/presentation/screens/notifications_screen.dart';
import 'package:tanjuriel_microfinance/features/loans/presentation/screens/apply_loan_screen.dart';
import 'package:tanjuriel_microfinance/features/loans/presentation/screens/loan_detail_screen.dart';
import 'package:tanjuriel_microfinance/features/loans/presentation/screens/loan_submitted_screen.dart';
import 'package:tanjuriel_microfinance/features/loans/presentation/screens/loans_screen.dart';
import 'package:tanjuriel_microfinance/features/kyc/presentation/screens/bvn_verification_screen.dart';
import 'package:tanjuriel_microfinance/features/kyc/presentation/screens/face_capture_screen.dart';
import 'package:tanjuriel_microfinance/features/kyc/presentation/screens/kyc_intro_screen.dart';
import 'package:tanjuriel_microfinance/features/kyc/presentation/screens/kyc_status_screen.dart';
import 'package:tanjuriel_microfinance/features/kyc/presentation/screens/nin_verification_screen.dart';
import 'package:tanjuriel_microfinance/features/profile/presentation/screens/account_details_screen.dart';
import 'package:tanjuriel_microfinance/features/profile/presentation/screens/change_password_screen.dart';
import 'package:tanjuriel_microfinance/features/profile/presentation/screens/change_pin_screen.dart';
import 'package:tanjuriel_microfinance/features/profile/presentation/screens/help_center_screen.dart';
import 'package:tanjuriel_microfinance/features/profile/presentation/screens/profile_screen.dart';
import 'package:tanjuriel_microfinance/features/savings/presentation/screens/open_account_screen.dart';
import 'package:tanjuriel_microfinance/features/savings/presentation/screens/request_withdrawal_screen.dart';
import 'package:tanjuriel_microfinance/features/savings/presentation/screens/savings_screen.dart';
import 'package:tanjuriel_microfinance/features/profile/presentation/screens/security_settings_screen.dart';
import 'package:tanjuriel_microfinance/features/profile/presentation/screens/terms_privacy_screen.dart';
import 'package:tanjuriel_microfinance/features/transactions/presentation/screens/transaction_detail_screen.dart';
import 'package:tanjuriel_microfinance/features/transactions/presentation/screens/transactions_screen.dart';
import 'package:tanjuriel_microfinance/features/transfer/presentation/screens/transfer_confirm_screen.dart';
import 'package:tanjuriel_microfinance/features/transfer/presentation/screens/transfer_screen.dart';
import 'package:tanjuriel_microfinance/features/transfer/presentation/screens/transfer_success_screen.dart';
import 'package:tanjuriel_microfinance/shared/models/loan_model.dart';
import 'package:tanjuriel_microfinance/shared/models/member_account.dart';
import 'package:tanjuriel_microfinance/shared/models/transfer_model.dart';
import 'package:tanjuriel_microfinance/core/widgets/app_shell_guard.dart';
import 'package:tanjuriel_microfinance/shared/shell/main_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = ref.watch(routerRefreshNotifierProvider);

  return GoRouter(
    initialLocation: RouteNames.splash,
    debugLogDiagnostics: kDebugMode,
    refreshListenable: refreshNotifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final location = state.matchedLocation;
      final user = authState.user;

      const publicRoutes = {
        RouteNames.welcome,
        RouteNames.register,
        RouteNames.login,
        RouteNames.otpVerification,
        RouteNames.splash,
      };

      const kycRoutes = {
        RouteNames.kycIntro,
        RouteNames.bvnVerification,
        RouteNames.ninVerification,
        RouteNames.faceCapture,
        RouteNames.kycStatus,
      };

      final isAuth = authState.status == AuthStatus.authenticated;
      const postAuthDestination = RouteNames.home;

      // Splash: wait for session check, then route onward
      if (location == RouteNames.splash) {
        if (authState.status == AuthStatus.initial ||
            authState.status == AuthStatus.loading) {
          return null;
        }
        return isAuth ? postAuthDestination : RouteNames.welcome;
      }

      // Block protected routes when logged out
      if (!isAuth && !publicRoutes.contains(location) && !kycRoutes.contains(location)) {
        return RouteNames.welcome;
      }

      // After login/register, leave auth screens
      if (isAuth && publicRoutes.contains(location) && location != RouteNames.splash) {
        return postAuthDestination;
      }

      return null;
    },
    routes: [
      GoRoute(path: RouteNames.splash, builder: (_, __) => const SplashScreen()),
      GoRoute(path: RouteNames.welcome, builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: RouteNames.register, builder: (_, __) => const RegisterScreen()),
      GoRoute(path: RouteNames.login, builder: (_, __) => const LoginScreen()),
      GoRoute(path: RouteNames.otpVerification, builder: (_, __) => const OtpVerificationScreen()),
      GoRoute(path: RouteNames.kycIntro, builder: (_, __) => const KycIntroScreen()),
      GoRoute(path: RouteNames.bvnVerification, builder: (_, __) => const BvnVerificationScreen()),
      GoRoute(path: RouteNames.ninVerification, builder: (_, __) => const NinVerificationScreen()),
      GoRoute(path: RouteNames.faceCapture, builder: (_, __) => const FaceCaptureScreen()),
      GoRoute(path: RouteNames.kycStatus, builder: (_, __) => const KycStatusScreen()),
      GoRoute(path: RouteNames.fundAccount, builder: (_, __) => const FundAccountScreen()),
      GoRoute(path: RouteNames.savings, builder: (_, __) => const SavingsScreen()),
      GoRoute(
        path: RouteNames.openAccount,
        builder: (_, __) => const OpenAccountScreen(),
      ),
      GoRoute(
        path: RouteNames.requestWithdrawal,
        builder: (_, state) => RequestWithdrawalScreen(account: state.extra as MemberAccount),
      ),
      GoRoute(path: RouteNames.notifications, builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: RouteNames.loans, builder: (_, __) => const LoansScreen()),
      GoRoute(path: RouteNames.applyLoan, builder: (_, __) => const ApplyLoanScreen()),
      GoRoute(
        path: RouteNames.loanSubmitted,
        builder: (_, state) => LoanSubmittedScreen(loan: state.extra as LoanModel),
      ),
      GoRoute(
        path: RouteNames.loanDetail,
        builder: (_, state) => LoanDetailScreen(loanId: state.pathParameters['id']!),
      ),
      GoRoute(path: RouteNames.transferConfirm, builder: (_, state) {
        final extra = state.extra as Map<String, dynamic>;
        return TransferConfirmScreen(
          bank: extra['bank'] as BankModel,
          accountNumber: extra['accountNumber'] as String,
          accountName: extra['accountName'] as String,
          amount: extra['amount'] as double,
          narration: extra['narration'] as String,
          sessionId: extra['sessionId'] as String,
        );
      }),
      GoRoute(path: RouteNames.transferSuccess, builder: (_, state) {
        final result = state.extra as TransferResult;
        return TransferSuccessScreen(result: result);
      }),
      GoRoute(
        path: RouteNames.transactionDetail,
        builder: (_, state) => TransactionDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(path: RouteNames.securitySettings, builder: (_, __) => const SecuritySettingsScreen()),
      GoRoute(path: RouteNames.changePassword, builder: (_, __) => const ChangePasswordScreen()),
      GoRoute(path: RouteNames.changePin, builder: (_, __) => const ChangePinScreen()),
      GoRoute(path: RouteNames.accountDetails, builder: (_, __) => const AccountDetailsScreen()),
      GoRoute(path: RouteNames.helpCenter, builder: (_, __) => const HelpCenterScreen()),
      GoRoute(path: RouteNames.termsPrivacy, builder: (_, __) => const TermsPrivacyScreen()),
      ShellRoute(
        builder: (context, state, child) => AppShellGuard(child: MainShell(child: child)),
        routes: [
          GoRoute(path: RouteNames.home, builder: (_, __) => const DashboardScreen()),
          GoRoute(path: RouteNames.transfer, builder: (_, __) => const TransferScreen()),
          GoRoute(path: RouteNames.transactions, builder: (_, __) => const TransactionsScreen()),
          GoRoute(path: RouteNames.profile, builder: (_, __) => const ProfileScreen()),
        ],
      ),
    ],
  );
});
