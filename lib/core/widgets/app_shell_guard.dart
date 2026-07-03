import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/core/security/session_lock_overlay.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';

/// Periodically refreshes profile while KYC is pending.
class KycProfileRefresher extends ConsumerStatefulWidget {
  const KycProfileRefresher({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<KycProfileRefresher> createState() => _KycProfileRefresherState();
}

class _KycProfileRefresherState extends ConsumerState<KycProfileRefresher> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _scheduleRefresh());
  }

  void _scheduleRefresh() {
    final user = ref.read(authProvider).user;
    if (user == null || user.isKycComplete) return;
    Future<void>.delayed(const Duration(seconds: 30), () async {
      if (!mounted) return;
      await ref.read(authProvider.notifier).refreshProfile();
      _scheduleRefresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (prev, next) {
      if (next.user != null && !next.user!.isKycComplete) {
        _scheduleRefresh();
      }
    });
    return widget.child;
  }
}

/// Wraps authenticated shell with session lock + KYC polling.
class AppShellGuard extends StatelessWidget {
  const AppShellGuard({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SessionLockOverlay(
      child: KycProfileRefresher(child: child),
    );
  }
}
