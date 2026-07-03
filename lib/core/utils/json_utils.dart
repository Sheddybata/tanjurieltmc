/// Parses API numbers that may arrive as JSON numbers or decimal strings (Prisma).
class JsonUtils {
  JsonUtils._();

  static double parseDouble(dynamic value, {double fallback = 0}) {
    if (value == null) return fallback;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }

  static int parseInt(dynamic value, {int fallback = 0}) {
    if (value == null) return fallback;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    return fallback;
  }

  static String parseString(dynamic value, {String fallback = ''}) {
    if (value == null) return fallback;
    if (value is String) return value;
    return value.toString();
  }

  /// NestJS validation errors return `message` as a String or List<String>.
  static String formatApiMessage(dynamic message, {String fallback = 'Request failed'}) {
    if (message == null) return fallback;
    if (message is String) return message;
    if (message is List) {
      return message.map((e) => e.toString()).join('\n');
    }
    return message.toString();
  }
}
