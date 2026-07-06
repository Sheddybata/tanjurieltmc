import 'package:tanjuriel_microfinance/shared/models/member_account.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

abstract class AccountRepository {
  Future<AccountBalance> getBalance();
  Future<UserModel> getProfile({bool forceRefresh = false});
  Future<({UserModel user, List<MemberAccount> accounts, AccountBalance balance})> getDashboardData({bool forceRefresh = true});
}
