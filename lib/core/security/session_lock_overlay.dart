import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';
import 'package:tanjuriel_microfinance/core/widgets/pin_input_field.dart';
import 'package:tanjuriel_microfinance/features/auth/presentation/providers/auth_provider.dart';
import 'package:tanjuriel_microfinance/shared/providers/repository_providers.dart';

/// Locks the app after idle timeout; user re-enters PIN to continue.
class SessionLockOverlay extends ConsumerStatefulWidget {
  const SessionLockOverlay({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<SessionLockOverlay> createState() => _SessionLockOverlayState();
}

class _SessionLockOverlayState extends ConsumerState<SessionLockOverlay> with WidgetsBindingObserver {
  DateTime _lastActivity = DateTime.now();
  bool _locked = false;
  bool _verifying = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  void _touch() {
    if (!_locked) _lastActivity = DateTime.now();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _maybeLock(force: true);
    } else if (state == AppLifecycleState.resumed) {
      _maybeLock();
      if (!_locked) {
        ref.read(authProvider.notifier).refreshProfile();
      }
    }
  }

  void _maybeLock({bool force = false}) {
    final auth = ref.read(authProvider);
    if (auth.status != AuthStatus.authenticated) return;

    final idle = DateTime.now().difference(_lastActivity);
    if (force || idle >= AppConstants.sessionTimeout) {
      setState(() => _locked = true);
    }
  }

  Future<void> _unlock(String pin) async {
    setState(() {
      _verifying = true;
      _error = null;
    });
    try {
      final ok = await ref.read(profileRepositoryProvider).verifyPin(pin);
      if (!mounted) return;
      if (ok) {
        setState(() {
          _locked = false;
          _lastActivity = DateTime.now();
        });
      } else {
        setState(() => _error = 'Incorrect PIN');
      }
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not verify PIN');
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _touch(),
      onPointerSignal: (_) => _touch(),
      child: Stack(
        children: [
          widget.child,
          if (_locked)
            Positioned.fill(
              child: Material(
                color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.98),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.lock_outline, size: 48, color: Theme.of(context).colorScheme.primary),
                        const SizedBox(height: 16),
                        Text('Session locked', style: Theme.of(context).textTheme.headlineSmall),
                        const SizedBox(height: 8),
                        Text('Enter your PIN to continue', style: Theme.of(context).textTheme.bodyMedium),
                        const SizedBox(height: 32),
                        PinInputField(onCompleted: _verifying ? (_) {} : _unlock),
                        if (_error != null) ...[
                          const SizedBox(height: 16),
                          Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                        ],
                        if (_verifying) ...[
                          const SizedBox(height: 24),
                          const CircularProgressIndicator(),
                        ],
                        const SizedBox(height: 32),
                        TextButton(
                          onPressed: () async {
                            await ref.read(authProvider.notifier).logout();
                            if (context.mounted) setState(() => _locked = false);
                          },
                          child: const Text('Sign out instead'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
