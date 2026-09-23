import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Swallows the Android back press that would close the app, and exits only
/// if back is pressed again within [window].
class ConfirmExitBackDispatcher extends RootBackButtonDispatcher {
  ConfirmExitBackDispatcher({required this.scaffoldMessengerKey});

  final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey;
  static const window = Duration(seconds: 2);
  DateTime? _lastBackPress;

  @override
  Future<bool> didPopRoute() async {
    final handled = await super.didPopRoute();
    if (handled) {
      _lastBackPress = null;
      return true;
    }

    final now = DateTime.now();
    final last = _lastBackPress;
    if (last != null && now.difference(last) <= window) {
      _lastBackPress = null;
      await SystemNavigator.pop();
      return true;
    }

    _lastBackPress = now;
    final messenger = scaffoldMessengerKey.currentState;
    messenger
      ?..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Press back again to exit'),
          duration: window,
          behavior: SnackBarBehavior.floating,
        ),
      );
    return true;
  }
}
