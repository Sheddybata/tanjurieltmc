import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/features/auth/domain/models/customer_registration_input.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/utils/auth_errors.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthState {
  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
    this.pendingPhone,
  });

  final AuthStatus status;
  final UserModel? user;
  final String? errorMessage;
  final String? pendingPhone;

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    String? errorMessage,
    String? pendingPhone,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
      pendingPhone: pendingPhone ?? this.pendingPhone,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._ref) : super(const AuthState());

  final Ref _ref;

  Future<void> checkAuthStatus() async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final isAuth = await _ref
          .read(authRepositoryProvider)
          .isAuthenticated()
          .timeout(const Duration(seconds: 5), onTimeout: () => false);

      if (isAuth) {
        final user = await _ref
            .read(accountRepositoryProvider)
            .getProfile()
            .timeout(const Duration(seconds: 5));
        state = state.copyWith(status: AuthStatus.authenticated, user: user);
      } else {
        state = state.copyWith(status: AuthStatus.unauthenticated);
      }
    } catch (_) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> register(CustomerRegistrationInput input) async {
    try {
      final user = await _ref.read(authRepositoryProvider).register(input);
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        errorMessage: null,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        errorMessage: formatAuthError(e),
      );
      return false;
    }
  }

  Future<bool> login({required String phone, required String pin}) async {
    try {
      final user = await _ref.read(authRepositoryProvider).login(
            phone: phone,
            pin: pin,
          );
      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        errorMessage: null,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        errorMessage: formatAuthError(e),
      );
      return false;
    }
  }

  Future<bool> verifyOtp(String otp) async {
    final phone = state.pendingPhone;
    if (phone == null) return false;
    try {
      await _ref.read(authRepositoryProvider).verifyOtp(phone: phone, otp: otp);
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: formatAuthError(e));
      return false;
    }
  }

  Future<void> logout() async {
    await _ref.read(authRepositoryProvider).logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  void updateUser(UserModel user) {
    state = state.copyWith(user: user);
  }

  Future<void> refreshProfile() async {
    if (state.status != AuthStatus.authenticated) return;
    try {
      final user = await _ref.read(accountRepositoryProvider).getProfile(forceRefresh: true);
      state = state.copyWith(user: user);
    } catch (_) {}
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});

final balanceVisibilityProvider = StateProvider<bool>((ref) => false);
