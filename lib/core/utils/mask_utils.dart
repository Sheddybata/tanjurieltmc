import 'package:tanjuriel_microfinance/core/constants/app_constants.dart';

class MaskUtils {
  static String maskBalance(String formattedBalance) {
    return '${AppConstants.currencySymbol} ••••••';
  }

  static String maskAccountNumber(String accountNumber) {
    if (accountNumber.length <= 4) return accountNumber;
    final visible = accountNumber.substring(accountNumber.length - 4);
    return '****$visible';
  }

  static String maskPhone(String phone) {
    if (phone.length <= 4) return phone;
    return '${phone.substring(0, 3)}****${phone.substring(phone.length - 2)}';
  }

  static String maskBvn(String bvn) {
    if (bvn.length != AppConstants.bvnLength) return bvn;
    return '${bvn.substring(0, 3)}****${bvn.substring(7)}';
  }
}
