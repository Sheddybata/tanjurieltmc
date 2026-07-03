import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tanjuriel_microfinance/core/config/app_config.dart';
import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';
import 'package:tanjuriel_microfinance/core/utils/json_utils.dart';
import 'package:tanjuriel_microfinance/core/errors/app_exception.dart';
import 'package:tanjuriel_microfinance/core/network/dio_interceptors.dart';
import 'package:tanjuriel_microfinance/core/network/mock_api_handler.dart';
import 'package:tanjuriel_microfinance/core/security/secure_storage_service.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConstants.apiTimeout,
      receiveTimeout: AppConstants.apiTimeout,
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
    ),
  );

  final storage = ref.watch(secureStorageServiceProvider);
  dio.interceptors.addAll([
    AuthInterceptor(storage: storage),
    LoggingInterceptor(),
    ErrorInterceptor(),
  ]);

  return dio;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(dioProvider));
});

class ApiClient {
  ApiClient(this._dio);

  final Dio _dio;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    if (AppConfig.useMockApi) {
      return MockApiHandler.get<T>(path, queryParameters: queryParameters);
    }
    return _dio.get<T>(path, queryParameters: queryParameters);
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) {
    if (AppConfig.useMockApi) {
      return MockApiHandler.post<T>(path, data: data);
    }
    return _dio.post<T>(path, data: data, queryParameters: queryParameters);
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
  }) {
    return _dio.put<T>(path, data: data);
  }

  Future<Response<T>> delete<T>(String path) {
    return _dio.delete<T>(path);
  }

  Future<Response<T>> patch<T>(String path, {dynamic data}) {
    if (AppConfig.useMockApi) {
      return MockApiHandler.patch<T>(path, data: data);
    }
    return _dio.patch<T>(path, data: data);
  }
}

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final response = err.response;
    final message = _extractMessage(response) ?? err.message ?? 'Network error';

    final exception = switch (err.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.receiveTimeout ||
      DioExceptionType.sendTimeout =>
        NetworkException('Connection timed out. Please try again.'),
      DioExceptionType.connectionError =>
        NetworkException('No internet connection.'),
      _ => NetworkException(message, code: response?.statusCode?.toString()),
    };

    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        error: exception,
        response: response,
        type: err.type,
      ),
    );
  }

  String? _extractMessage(Response<dynamic>? response) {
    final data = response?.data;
    if (data is Map<String, dynamic>) {
      return JsonUtils.formatApiMessage(
        data['message'],
        fallback: JsonUtils.formatApiMessage(data['error'], fallback: 'Request failed'),
      );
    }
    return null;
  }
}
