import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/core/utils/json_utils.dart';
import 'package:tanjuriel_microfinance/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/dashboard/domain/repositories/account_repository.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

class AccountRepositoryImpl implements AccountRepository {
  AccountRepositoryImpl(this._api);

  final ApiClient _api;

  @override
  Future<AccountBalance> getBalance() async {
    final response = await _api.get<Map<String, dynamic>>('/customer/me');
    final data = response.data?['data'] as Map<String, dynamic>?;
    final accounts = (data?['accounts'] as List<dynamic>?) ?? [];
    if (accounts.isEmpty) {
      return const AccountBalance(available: 0, ledger: 0, currency: 'NGN');
    }
    final account = accounts.first as Map<String, dynamic>;
    final ledger = JsonUtils.parseDouble(account['balance']);
    final available = JsonUtils.parseDouble(account['availableBalance'], fallback: ledger);
    return AccountBalance(available: available, ledger: ledger, currency: 'NGN');
  }

  @override
  Future<UserModel> getProfile({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = AuthRepositoryImpl.currentUser;
      if (cached != null) return cached;
    }

    final response = await _api.get<Map<String, dynamic>>('/customer/me');
    final body = response.data;
    if (body?['success'] != true) {
      throw Exception('Unable to load profile');
    }

    final customer = body!['data'] as Map<String, dynamic>;
    final accounts = (customer['accounts'] as List<dynamic>?) ?? [];
    final primaryAccount = accounts.isNotEmpty ? accounts.first as Map<String, dynamic> : null;

    final user = UserModel(
      id: customer['id'] as String,
      firstName: customer['firstName'] as String,
      lastName: customer['lastName'] as String,
      email: customer['email'] as String? ?? '',
      phone: customer['phone'] as String,
      accountNumber: primaryAccount?['accountNumber'] as String? ?? '',
      accountId: primaryAccount?['id'] as String?,
      paymentRef: customer['paymentRef'] as String?,
      kycStatus: customer['kycStatus'] == 'VERIFIED' ? KycStatus.approved : KycStatus.underReview,
      bvnVerified: customer['bvn'] != null,
      ninVerified: customer['nin'] != null,
    );

    AuthRepositoryImpl.setCurrentUser(user);
    return user;
  }
}
