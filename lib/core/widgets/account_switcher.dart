import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/shared/providers/member_accounts_provider.dart';

class AccountSwitcher extends ConsumerWidget {
  const AccountSwitcher({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accounts = ref.watch(memberAccountsProvider);
    final selected = ref.watch(selectedAccountProvider);

    if (accounts.length <= 1) {
      if (selected == null) return const SizedBox.shrink();
      return Text(
        selected.displayName,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
      );
    }

    return DropdownButtonHideUnderline(
      child: DropdownButton<String>(
        value: selected?.id,
        dropdownColor: Theme.of(context).colorScheme.primaryContainer,
        icon: Icon(Icons.expand_more, color: compact ? Colors.white70 : null, size: 20),
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: compact ? Colors.white : null,
            ),
        items: accounts
            .map(
              (a) => DropdownMenuItem(
                value: a.id,
                child: Text('${a.displayName} · ${a.accountNumber}'),
              ),
            )
            .toList(),
        onChanged: (id) {
          final account = accounts.where((a) => a.id == id).firstOrNull;
          if (account != null) {
            ref.read(selectedAccountProvider.notifier).state = account;
          }
        },
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
