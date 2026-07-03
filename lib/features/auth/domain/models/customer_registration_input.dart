import 'package:tanjuriel_microfinance/core/utils/json_utils.dart';
import 'package:tanjuriel_microfinance/shared/models/user_model.dart';

class CustomerRegistrationInput {
  const CustomerRegistrationInput({
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.dateOfBirth,
    required this.gender,
    required this.bvn,
    required this.nin,
    required this.address,
    required this.city,
    required this.state,
    required this.pin,
    this.middleName,
    this.email,
    this.occupation,
    this.employer,
    this.monthlyIncome,
  });

  final String firstName;
  final String lastName;
  final String? middleName;
  final String phone;
  final String? email;
  final DateTime dateOfBirth;
  final String gender;
  final String bvn;
  final String nin;
  final String address;
  final String city;
  final String state;
  final String? occupation;
  final String? employer;
  final double? monthlyIncome;
  final String pin;

  Map<String, dynamic> toJson() => {
        'firstName': firstName,
        'lastName': lastName,
        if (middleName != null && middleName!.isNotEmpty) 'middleName': middleName,
        'phone': phone,
        if (email != null && email!.isNotEmpty) 'email': email,
        'dateOfBirth': dateOfBirth.toIso8601String().split('T').first,
        'gender': gender,
        'bvn': bvn,
        'nin': nin,
        'address': address,
        'city': city,
        'state': state,
        if (occupation != null && occupation!.isNotEmpty) 'occupation': occupation,
        if (employer != null && employer!.isNotEmpty) 'employer': employer,
        if (monthlyIncome != null) 'monthlyIncome': monthlyIncome,
        'pin': pin,
      };
}

UserModel userFromAuthCustomer(Map<String, dynamic> customer) {
  final accounts = (customer['accounts'] as List<dynamic>?) ?? [];
  final primaryAccount = accounts.isNotEmpty ? accounts.first as Map<String, dynamic> : null;
  return UserModel(
    id: customer['id'] as String,
    firstName: customer['firstName'] as String,
    lastName: customer['lastName'] as String,
    email: customer['email'] as String? ?? '',
    phone: customer['phone'] as String,
    accountNumber: JsonUtils.parseString(primaryAccount?['accountNumber']),
    accountId: primaryAccount?['id'] as String?,
    paymentRef: JsonUtils.parseString(customer['paymentRef']),
    accountType: primaryAccount?['type'] as String?,
    kycStatus: _mapKyc(customer['kycStatus'] as String?),
    bvnVerified: customer['bvn'] != null,
    ninVerified: customer['nin'] != null,
  );
}

KycStatus _mapKyc(String? status) {
  switch (status) {
    case 'VERIFIED':
      return KycStatus.approved;
    case 'REJECTED':
      return KycStatus.rejected;
    case 'PENDING':
      return KycStatus.underReview;
    default:
      return KycStatus.notStarted;
  }
}
