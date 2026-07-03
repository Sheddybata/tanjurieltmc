import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/core/utils/json_utils.dart';
import 'package:tanjuriel_microfinance/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/dashboard/domain/repositories/account_repository.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

class AccountRepositoryImpl implements AccountRepository {
  AccountRepositoryImpl(this._api);

  final ApiClient _api;

  UserModel _userFromCustomer(Map<String, dynamic> customer) {
    final accounts = (customer['accounts'] as List<dynamic>?) ?? [];
    final primaryAccount = accounts.isNotEmpty ? accounts.first as Map<String, dynamic> : null;
    return UserModel(
      id: customer['id'] as String,
      firstName: customer['firstName'] as String,
      lastName: customer['lastName'] as String,
      email: customer['email'] as String? ?? '',
      phone: customer['phone'] as String,
      accountNumber: JsonUtils.parseString(primaryAccount?['accountNumber']),
      accountId: primaryAccount?['id'] as String?,
      paymentRef: JsonUtils.parseString(customer['paymentRef']),
      accountType: primaryAccount?['type'] as String?,
      kycStatus: _mapKyc(customer['kycStatus'] as String?),
      bvnVerified: customer['bvn'] != null,
      ninVerified: customer['nin'] != null,
    );
  }

  KycStatus _mapKyc(String? status) {
    switch (status) {
      case 'VERIFIED':
        return KycStatus.approved;
      case 'REJECTED':
        return KycStatus.rejected;
      case 'PENDING':
        return KycStatus.underReview;
      default:
        return KycStatus.notStarted;
    }
  }

  Future<Map<String, dynamic>> _fetchCustomer() async {
    final response = await _api.get<Map<String, dynamic>>('/customer/me');
    final body = response.data;
    if (body?['success'] != true) {
      throw Exception('Unable to load profile');
    }
    return body!['data'] as Map<String, dynamic>;
  }

  @override
  Future<AccountBalance> getBalance() async {
    final customer = await _fetchCustomer();
    final accounts = (customer['accounts'] as List<dynamic>?) ?? [];
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

    final customer = await _fetchCustomer();
    final user = _userFromCustomer(customer);
    AuthRepositoryImpl.setCurrentUser(user);
    return user;
  }

  @override
  Future<({UserModel user, AccountBalance balance})> getDashboardData({bool forceRefresh = true}) async {
    final customer = await _fetchCustomer();
    final user = _userFromCustomer(customer);
    AuthRepositoryImpl.setCurrentUser(user);

    final accounts = (customer['accounts'] as List<dynamic>?) ?? [];
    if (accounts.isEmpty) {
      return (
        user: user,
        balance: const AccountBalance(available: 0, ledger: 0, currency: 'NGN'),
      );
    }
    final account = accounts.first as Map<String, dynamic>;
    final ledger = JsonUtils.parseDouble(account['balance']);
    final available = JsonUtils.parseDouble(account['availableBalance'], fallback: ledger);
    return (
      user: user,
      balance: AccountBalance(available: available, ledger: ledger, currency: 'NGN'),
    );
  }
}
