import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

abstract class AccountRepository {
  Future<AccountBalance> getBalance();
  Future<UserModel> getProfile({bool forceRefresh = false});
  Future<({UserModel user, AccountBalance balance})> getDashboardData({bool forceRefresh = true});
}
