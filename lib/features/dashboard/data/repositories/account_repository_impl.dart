import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/core/utils/json_utils.dart';
import 'package:tanjuriel_microfinance/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/dashboard/domain/repositories/account_repository.dart';
import 'package:tanjuriel_microfinance/shared/models/member_account.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

class AccountRepositoryImpl implements AccountRepository {
  AccountRepositoryImpl(this._api);

  final ApiClient _api;

  List<MemberAccount> _accountsFromCustomer(Map<String, dynamic> customer) {
    final accounts = (customer['accounts'] as List<dynamic>?) ?? [];
    return accounts
        .map((a) => MemberAccount.fromJson(Map<String, dynamic>.from(a as Map)))
        .toList();
  }

  MemberAccount? _pickPrimary(List<MemberAccount> accounts) {
    if (accounts.isEmpty) return null;
    return accounts.where((a) => a.type == 'SAVINGS').firstOrNull ?? accounts.first;
  }

  UserModel _userFromCustomer(Map<String, dynamic> customer, {MemberAccount? primary}) {
    final primaryAccount = primary ?? _pickPrimary(_accountsFromCustomer(customer));
    return UserModel(
      id: customer['id'] as String,
      firstName: customer['firstName'] as String,
      lastName: customer['lastName'] as String,
      email: customer['email'] as String? ?? '',
      phone: customer['phone'] as String,
      accountNumber: primaryAccount?.accountNumber ?? '',
      accountId: primaryAccount?.id,
      paymentRef: JsonUtils.parseString(customer['paymentRef']),
      accountType: primaryAccount?.type,
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
    final accounts = _accountsFromCustomer(customer);
    final account = _pickPrimary(accounts);
    if (account == null) {
      return const AccountBalance(available: 0, ledger: 0, currency: 'NGN');
    }
    return AccountBalance(
      available: account.availableBalance,
      ledger: account.balance,
      currency: 'NGN',
    );
  }

  @override
  Future<UserModel> getProfile({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = AuthRepositoryImpl.currentUser;
      if (cached != null) return cached;
    }

    final customer = await _fetchCustomer();
    final accounts = _accountsFromCustomer(customer);
    final user = _userFromCustomer(customer, primary: _pickPrimary(accounts));
    AuthRepositoryImpl.setCurrentUser(user);
    return user;
  }

  @override
  Future<({UserModel user, List<MemberAccount> accounts, AccountBalance balance})> getDashboardData({bool forceRefresh = true}) async {
    final customer = await _fetchCustomer();
    final accounts = _accountsFromCustomer(customer);
    final primary = _pickPrimary(accounts);
    final user = _userFromCustomer(customer, primary: primary);
    AuthRepositoryImpl.setCurrentUser(user);

    if (primary == null) {
      return (
        user: user,
        accounts: accounts,
        balance: const AccountBalance(available: 0, ledger: 0, currency: 'NGN'),
      );
    }

    return (
      user: user,
      accounts: accounts,
      balance: AccountBalance(
        available: primary.availableBalance,
        ledger: primary.balance,
        currency: 'NGN',
      ),
    );
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull {
    final iterator = this.iterator;
    if (iterator.moveNext()) return iterator.current;
    return null;
  }
}
