import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/core/security/secure_storage_service.dart';
import 'package:tanjuriel_microfinance/features/auth/domain/models/customer_registration_input.dart';
import 'package:tanjuriel_microfinance/features/auth/domain/repositories/auth_repository.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._storage, this._api);

  final SecureStorageService _storage;
  final ApiClient _api;

  static UserModel? _currentUser;

  @override
  Future<UserModel> register(CustomerRegistrationInput input) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/customer/auth/register',
      data: input.toJson(),
    );

    final body = response.data;
    if (body?['success'] != true) {
      throw Exception(body?['message'] ?? 'Registration failed');
    }

    final data = body!['data'] as Map<String, dynamic>;
    await _storage.writeAccessToken(data['accessToken'] as String);
    await _storage.writeRefreshToken(data['refreshToken'] as String);

    final customer = data['customer'] as Map<String, dynamic>;
    final user = userFromAuthCustomer(customer);

    _currentUser = user;
    await _storage.writeUserId(user.id);
    await _storage.writePinHash(input.pin);

    return user;
  }

  @override
  Future<UserModel> login({required String phone, required String pin}) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/customer/auth/login',
      data: {'phone': phone, 'pin': pin},
    );

    final body = response.data;
    if (body?['success'] != true) {
      throw Exception(body?['message'] ?? 'Login failed');
    }

    final data = body!['data'] as Map<String, dynamic>;
    await _storage.writeAccessToken(data['accessToken'] as String);
    await _storage.writeRefreshToken(data['refreshToken'] as String);

    final customer = data['customer'] as Map<String, dynamic>;
    final user = userFromAuthCustomer(customer);

    _currentUser = user;
    await _storage.writeUserId(user.id);
    await _storage.writePinHash(pin);

    return user;
  }

  @override
  Future<void> verifyOtp({required String phone, required String otp}) async {
    throw UnsupportedError('OTP verification is not used for customer PIN login.');
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await _storage.readAccessToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<void> logout() async {
    try {
      final refresh = await _storage.readRefreshToken();
      await _api.post('/customer/auth/logout', data: {'refreshToken': refresh});
    } catch (_) {
      // ignore network errors on logout
    }
    await _storage.clearSession();
    _currentUser = null;
  }

  static UserModel? get currentUser => _currentUser;

  static void setCurrentUser(UserModel? user) => _currentUser = user;
}
