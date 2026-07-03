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

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api/v1',
  );
}
