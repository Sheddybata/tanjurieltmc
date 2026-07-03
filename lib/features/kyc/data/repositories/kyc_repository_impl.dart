import 'package:tanjuriel_microfinance/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/kyc/domain/repositories/kyc_repository.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

class KycRepositoryImpl implements KycRepository {
  @override
  Future<Map<String, dynamic>> verifyBvn({
    required String bvn,
    required String dateOfBirth,
    required String phone,
  }) async {
    await Future<void>.delayed(const Duration(seconds: 1));

    if (bvn == '00000000000') {
      throw Exception('BVN verification failed. Please check your details.');
    }

    final user = AuthRepositoryImpl.currentUser;
    if (user != null) {
      AuthRepositoryImpl.setCurrentUser(user.copyWith(
        bvnVerified: true,
        kycStatus: KycStatus.bvnVerified,
      ));
    }

    return {
      'status': 'verified',
      'first_name': user?.firstName ?? 'Adaeze',
      'last_name': user?.lastName ?? 'Okonkwo',
      'date_of_birth': dateOfBirth,
      'phone': phone,
      'bvn': bvn,
    };
  }

  @override
  Future<Map<String, dynamic>> verifyNin({
    required String nin,
    required String firstName,
    required String lastName,
  }) async {
    await Future<void>.delayed(const Duration(seconds: 1));

    if (nin == '00000000000') {
      throw Exception('NIN verification failed. Details do not match.');
    }

    final user = AuthRepositoryImpl.currentUser;
    if (user != null) {
      AuthRepositoryImpl.setCurrentUser(user.copyWith(
        ninVerified: true,
        kycStatus: KycStatus.ninVerified,
      ));
    }

    return {
      'status': 'verified',
      'nin': nin,
      'first_name': firstName,
      'last_name': lastName,
    };
  }

  @override
  Future<void> submitFaceCapture({required String imageBase64}) async {
    await Future<void>.delayed(const Duration(seconds: 1));

    final user = AuthRepositoryImpl.currentUser;
    if (user != null) {
      AuthRepositoryImpl.setCurrentUser(user.copyWith(kycStatus: KycStatus.underReview));
    }
  }

  @override
  Future<KycStatus> getKycStatus() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return AuthRepositoryImpl.currentUser?.kycStatus ?? KycStatus.notStarted;
  }
}
