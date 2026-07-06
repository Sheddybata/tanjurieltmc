import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/shared/models/member_account.dart';

final memberAccountsProvider = StateProvider<List<MemberAccount>>((ref) => []);

final selectedAccountProvider = StateProvider<MemberAccount?>((ref) => null);

void setMemberAccounts(WidgetRef ref, List<MemberAccount> accounts, {MemberAccount? prefer}) {
  ref.read(memberAccountsProvider.notifier).state = accounts;
  if (accounts.isEmpty) {
    ref.read(selectedAccountProvider.notifier).state = null;
    return;
  }

  MemberAccount? next = prefer;
  if (next == null) {
    next = accounts.where((a) => a.type == 'SAVINGS').cast<MemberAccount?>().firstOrNull ?? accounts.first;
  }
  ref.read(selectedAccountProvider.notifier).state = next;
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull {
    final iterator = this.iterator;
    if (iterator.moveNext()) return iterator.current;
    return null;
  }
}
