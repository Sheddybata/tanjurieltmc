import 'package:flutter/material.dart';

class GreetingInfo {
  const GreetingInfo({required this.greeting, required this.icon});

  final String greeting;
  final IconData icon;
}

class GreetingUtil {
  GreetingUtil._();

  static GreetingInfo forNow([DateTime? now]) {
    final hour = (now ?? DateTime.now()).hour;
    if (hour >= 5 && hour < 12) {
      return const GreetingInfo(greeting: 'Good morning', icon: Icons.wb_sunny_outlined);
    }
    if (hour >= 12 && hour < 17) {
      return const GreetingInfo(greeting: 'Good afternoon', icon: Icons.wb_cloudy_outlined);
    }
    return const GreetingInfo(greeting: 'Good evening', icon: Icons.nights_stay_outlined);
  }
}
