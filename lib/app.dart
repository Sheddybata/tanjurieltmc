import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';
import 'package:tanjuriel_microfinance/core/router/app_router.dart';
import 'package:tanjuriel_microfinance/core/theme/app_theme.dart';

class TanjurielApp extends ConsumerWidget {
  const TanjurielApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
