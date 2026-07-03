import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tanjuriel_microfinance/core/router/route_names.dart';

class SecuritySettingsScreen extends ConsumerWidget {
  const SecuritySettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Security Settings')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          ListTile(
            leading: const Icon(Icons.fingerprint),
            title: const Text('Biometric login'),
            subtitle: const Text('Coming soon'),
            enabled: false,
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Change Password'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(RouteNames.changePassword),
          ),
          ListTile(
            leading: const Icon(Icons.pin_outlined),
            title: const Text('Change Transaction PIN'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(RouteNames.changePin),
          ),
        ],
      ),
    );
  }
}
