import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageServiceProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userIdKey = 'user_id';
  static const _biometricEnabledKey = 'biometric_enabled';
  static const _pinHashKey = 'pin_hash';
  static const _storageTimeout = Duration(seconds: 3);

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  Future<void> _safeWrite(String key, String value) async {
    try {
      await _storage.write(key: key, value: value).timeout(_storageTimeout);
    } catch (_) {
      // Storage failures must not block demo auth flows
    }
  }

  Future<String?> _safeRead(String key) async {
    try {
      return await _storage.read(key: key).timeout(_storageTimeout);
    } catch (_) {
      return null;
    }
  }

  Future<void> writeAccessToken(String token) => _safeWrite(_accessTokenKey, token);

  Future<String?> readAccessToken() => _safeRead(_accessTokenKey);

  Future<void> writeRefreshToken(String token) => _safeWrite(_refreshTokenKey, token);

  Future<String?> readRefreshToken() => _safeRead(_refreshTokenKey);

  Future<void> writeUserId(String userId) => _safeWrite(_userIdKey, userId);

  Future<String?> readUserId() => _safeRead(_userIdKey);

  Future<void> setBiometricEnabled(bool enabled) =>
      _safeWrite(_biometricEnabledKey, enabled.toString());

  Future<bool> isBiometricEnabled() async {
    final value = await _safeRead(_biometricEnabledKey);
    return value == 'true';
  }

  Future<void> writePinHash(String hash) => _safeWrite(_pinHashKey, hash);

  Future<String?> readPinHash() => _safeRead(_pinHashKey);

  Future<void> clearSession() async {
    try {
      await Future.wait([
        _storage.delete(key: _accessTokenKey).timeout(_storageTimeout),
        _storage.delete(key: _refreshTokenKey).timeout(_storageTimeout),
        _storage.delete(key: _userIdKey).timeout(_storageTimeout),
      ]);
    } catch (_) {}
  }

  Future<void> clearAll() async {
    try {
      await _storage.deleteAll().timeout(_storageTimeout);
    } catch (_) {}
  }
}
