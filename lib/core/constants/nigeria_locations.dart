import 'dart:convert';

import 'package:flutter/services.dart';

class NigeriaLocations {
  NigeriaLocations._();

  static List<String>? _states;
  static Map<String, List<String>>? _lgas;

  static Future<void> ensureLoaded() async {
    if (_states != null && _lgas != null) return;
    final statesRaw = await rootBundle.loadString('assets/data/states.json');
    final lgasRaw = await rootBundle.loadString('assets/data/lgas.json');
    _states = (jsonDecode(statesRaw) as List<dynamic>).cast<String>();
    _lgas = (jsonDecode(lgasRaw) as Map<String, dynamic>).map(
      (key, value) => MapEntry(key, (value as List<dynamic>).cast<String>()),
    );
  }

  static List<String> get states => List.unmodifiable(_states ?? const []);

  static List<String> lgasFor(String state) =>
      List.unmodifiable(_lgas?[state] ?? const []);
}
