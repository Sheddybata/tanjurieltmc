import 'package:intl/intl.dart';
import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';

class CurrencyFormatter {
  static final _formatter = NumberFormat.currency(
    locale: 'en_NG',
    symbol: AppConstants.currencySymbol,
    decimalDigits: 2,
  );

  static String format(num amount) => _formatter.format(amount);

  static String formatCompact(num amount) {
    if (amount >= 1000000) {
      return '${AppConstants.currencySymbol}${(amount / 1000000).toStringAsFixed(1)}M';
    }
    if (amount >= 1000) {
      return '${AppConstants.currencySymbol}${(amount / 1000).toStringAsFixed(1)}K';
    }
    return format(amount);
  }
}
