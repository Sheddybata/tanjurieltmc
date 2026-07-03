import 'package:tanjuriel_microfinance/core/security/secure_storage_service.dart';
import 'package:tanjuriel_microfinance/features/profile/domain/repositories/profile_repository.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl(this._storage);

  final SecureStorageService _storage;

  @override
  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (currentPassword.length < 8) {
      throw Exception('Current password is incorrect');
    }
  }

  @override
  Future<void> updatePin({
    required String currentPin,
    required String newPin,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    final storedPin = await _storage.readPinHash();
    if (storedPin != null && storedPin != currentPin) {
      throw Exception('Current PIN is incorrect');
    }
    await _storage.writePinHash(newPin);
  }

  @override
  Future<void> setBiometricEnabled(bool enabled) async {
    await _storage.setBiometricEnabled(enabled);
  }

  @override
  Future<bool> isBiometricEnabled() => _storage.isBiometricEnabled();

  @override
  Future<bool> verifyPin(String pin) async {
    final storedPin = await _storage.readPinHash();
    return storedPin == pin;
  }
}
