import 'package:dio/dio.dart';
import 'package:tanjuriel_microfinance/core/errors/app_exception.dart';

String formatAuthError(Object error) {
  if (error is DioException) {
    final inner = error.error;
    if (inner is AppException) return inner.message;

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'Cannot reach the server. Make sure the API is running on your computer.';
      case DioExceptionType.connectionError:
        return 'Cannot connect to the server. Check that the API is running and your phone/emulator can reach it.';
      default:
        break;
    }

    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is List && message.isNotEmpty) {
        return message.first.toString();
      }
      if (message is String && message.isNotEmpty) {
        return message;
      }
    }
  }

  if (error is AppException) return error.message;
  if (error is Exception) {
    return error.toString().replaceFirst('Exception: ', '');
  }
  return 'Something went wrong. Please try again.';
}
