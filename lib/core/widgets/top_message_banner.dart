import 'dart:async';

import 'package:flutter/material.dart';
import 'package:tanjuriel_microfinance/core/theme/app_colors.dart';

/// Brief message at the top of the screen (used on apply-loan only).
class TopMessageBanner {
  TopMessageBanner._();

  static OverlayEntry? _entry;
  static Timer? _timer;

  static void show(
    BuildContext context,
    String message, {
    bool isError = true,
    Duration duration = const Duration(seconds: 2),
  }) {
    hide();

    final overlay = Overlay.of(context);
    final topPadding = MediaQuery.paddingOf(context).top;

    _entry = OverlayEntry(
      builder: (ctx) => Positioned(
        top: topPadding + 8,
        left: 16,
        right: 16,
        child: Material(
          color: Colors.transparent,
          child: SafeArea(
            bottom: false,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isError ? AppColors.error : AppColors.success,
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [
                  BoxShadow(color: AppColors.shadow, blurRadius: 12, offset: Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  Icon(
                    isError ? Icons.error_outline : Icons.check_circle_outline,
                    color: Colors.white,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      message,
                      style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    overlay.insert(_entry!);
    _timer = Timer(duration, hide);
  }

  static void hide() {
    _timer?.cancel();
    _timer = null;
    _entry?.remove();
    _entry = null;
  }
}
