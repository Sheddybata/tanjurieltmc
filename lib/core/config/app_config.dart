/// App-wide flags. Override at run time with --dart-define.
class AppConfig {
  AppConfig._();

  /// When true, API calls return local demo data — no Supabase or NestJS required.
  /// Run with real backend: flutter run --dart-define=USE_MOCK_API=false
  static const bool useMockApi = bool.fromEnvironment(
    'USE_MOCK_API',
    defaultValue: true,
  );

  static const demoPhone = '08012345678';
  static const demoPin = '1234';

  static const String _rawApiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api/v1',
  );

  /// NestJS routes live under `/api/v1`. Accepts host-only defines too.
  static String get apiBaseUrl {
    var url = _rawApiBaseUrl.trim();
    while (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    if (!url.endsWith('/api/v1')) {
      url = '$url/api/v1';
    }
    return url;
  }
}
