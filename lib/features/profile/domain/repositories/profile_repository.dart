abstract class ProfileRepository {
  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  });

  Future<void> updatePin({
    required String currentPin,
    required String newPin,
  });

  Future<void> setBiometricEnabled(bool enabled);
  Future<bool> isBiometricEnabled();
  Future<bool> verifyPin(String pin);
}
