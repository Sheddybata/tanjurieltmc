import 'package:tanjuriel_microfinance/features/auth/domain/models/customer_registration_input.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

abstract class AuthRepository {
  Future<UserModel> register(CustomerRegistrationInput input);

  Future<UserModel> login({required String phone, required String pin});

  Future<void> verifyOtp({required String phone, required String otp});

  Future<bool> isAuthenticated();

  Future<void> logout();
}
