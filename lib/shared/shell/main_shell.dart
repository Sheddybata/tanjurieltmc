import 'package:flutter/material.dart';

import 'package:go_router/go_router.dart';

import 'package:tanjuriel_microfinance/core/router/route_names.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.child});

  final Widget child;

  int _currentIndex(String location) {
    if (location.startsWith(RouteNames.transactions)) return 1;
    if (location.startsWith(RouteNames.profile)) return 2;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex(location),
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go(RouteNames.home);
            case 1:
              context.go(RouteNames.transactions);
            case 2:
              context.go(RouteNames.profile);
          }
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.history_outlined), selectedIcon: Icon(Icons.history), label: 'History'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
