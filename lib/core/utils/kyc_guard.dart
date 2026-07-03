import 'package:flutter/material.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

class KycGuard {
  KycGuard._();

  static bool canUseBankingFeatures(UserModel? user) {
    return user != null && user.isKycComplete;
  }

  static void showBlockedMessage(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Account pending verification. Visit our Jos branch or wait for teller approval to use this feature.',
        ),
        duration: Duration(seconds: 4),
      ),
    );
  }

  static bool requireVerified(BuildContext context, UserModel? user) {
    if (canUseBankingFeatures(user)) return true;
    showBlockedMessage(context);
    return false;
  }
}
