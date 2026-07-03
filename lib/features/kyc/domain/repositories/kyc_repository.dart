import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

abstract class KycRepository {
  Future<Map<String, dynamic>> verifyBvn({
    required String bvn,
    required String dateOfBirth,
    required String phone,
  });

  Future<Map<String, dynamic>> verifyNin({
    required String nin,
    required String firstName,
    required String lastName,
  });

  Future<void> submitFaceCapture({required String imageBase64});

  Future<KycStatus> getKycStatus();
}
