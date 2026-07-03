import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/core/network/api_client.dart';
import 'package:tanjuriel_microfinance/core/security/secure_storage_service.dart';
import 'package:tanjuriel_microfinance/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/auth/domain/repositories/auth_repository.dart';
import 'package:tanjuriel_microfinance/features/dashboard/data/repositories/account_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/dashboard/domain/repositories/account_repository.dart';
import 'package:tanjuriel_microfinance/features/loans/data/repositories/loan_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/loans/domain/repositories/loan_repository.dart';
import 'package:tanjuriel_microfinance/features/kyc/data/repositories/kyc_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/kyc/domain/repositories/kyc_repository.dart';
import 'package:tanjuriel_microfinance/features/profile/data/repositories/profile_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/profile/domain/repositories/profile_repository.dart';
import 'package:tanjuriel_microfinance/features/transactions/data/repositories/transaction_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/transactions/domain/repositories/transaction_repository.dart';
import 'package:tanjuriel_microfinance/features/transfer/data/repositories/transfer_repository_impl.dart';
import 'package:tanjuriel_microfinance/features/transfer/domain/repositories/transfer_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    ref.watch(secureStorageServiceProvider),
    ref.watch(apiClientProvider),
  );
});

final kycRepositoryProvider = Provider<KycRepository>((ref) {
  return KycRepositoryImpl();
});

final accountRepositoryProvider = Provider<AccountRepository>((ref) {
  return AccountRepositoryImpl(ref.watch(apiClientProvider));
});

final transferRepositoryProvider = Provider<TransferRepository>((ref) {
  return TransferRepositoryImpl(ref.watch(apiClientProvider));
});

final transactionRepositoryProvider = Provider<TransactionRepository>((ref) {
  return TransactionRepositoryImpl(ref.watch(apiClientProvider));
});

final loanRepositoryProvider = Provider<LoanRepository>((ref) {
  return LoanRepositoryImpl(ref.watch(apiClientProvider));
});

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepositoryImpl(ref.watch(secureStorageServiceProvider));
});
