import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';
import 'package:tanjuriel_microfinance/core/navigation/confirm_exit_back_dispatcher.dart';
import 'package:tanjuriel_microfinance/core/router/app_router.dart';
import 'package:tanjuriel_microfinance/core/theme/app_theme.dart';

final rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

class TanjurielApp extends ConsumerStatefulWidget {
  const TanjurielApp({super.key});

  @override
  ConsumerState<TanjurielApp> createState() => _TanjurielAppState();
}

class _TanjurielAppState extends ConsumerState<TanjurielApp> {
  late final ConfirmExitBackDispatcher _backDispatcher = ConfirmExitBackDispatcher(
    scaffoldMessengerKey: rootScaffoldMessengerKey,
  );

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      scaffoldMessengerKey: rootScaffoldMessengerKey,
      backButtonDispatcher: _backDispatcher,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
