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
    required this.photoPath,
    this.title,
    this.middleName,
    this.maritalStatus,
    this.alternatePhone,
    this.email,
    this.lga,
    this.employmentStatus,
    this.employmentStatusNote,
    this.employmentStartDate,
    this.incomeBand,
    this.occupation,
    this.employer,
    this.employerPhone,
    this.employerEmail,
    this.employerAddress,
    this.natureOfBusiness,
    this.officeNumber,
    this.officePhone,
    this.officeState,
    this.officeLga,
  });

  final String? title;
  final String firstName;
  final String lastName;
  final String? middleName;
  final String? maritalStatus;
  final String phone;
  final String? alternatePhone;
  final String? email;
  final DateTime dateOfBirth;
  final String gender;
  final String bvn;
  final String nin;
  final String address;
  final String? lga;
  final String city;
  final String state;
  final String? employmentStatus;
  final String? employmentStatusNote;
  final DateTime? employmentStartDate;
  final String? incomeBand;
  final String? occupation;
  final String? employer;
  final String? employerPhone;
  final String? employerEmail;
  final String? employerAddress;
  final String? natureOfBusiness;
  final String? officeNumber;
  final String? officePhone;
  final String? officeState;
  final String? officeLga;
  final String pin;
  final String photoPath;

  Map<String, dynamic> toJson() => {
        if (title != null && title!.isNotEmpty) 'title': title,
        'firstName': firstName,
        'lastName': lastName,
        if (middleName != null && middleName!.isNotEmpty) 'middleName': middleName,
        if (maritalStatus != null && maritalStatus!.isNotEmpty) 'maritalStatus': maritalStatus,
        'phone': phone,
        if (alternatePhone != null && alternatePhone!.isNotEmpty) 'alternatePhone': alternatePhone,
        if (email != null && email!.isNotEmpty) 'email': email,
        'dateOfBirth': dateOfBirth.toIso8601String().split('T').first,
        'gender': gender,
        'bvn': bvn,
        'nin': nin,
        'address': address,
        if (lga != null && lga!.isNotEmpty) 'lga': lga,
        'city': city,
        'state': state,
        if (employmentStatus != null && employmentStatus!.isNotEmpty) 'employmentStatus': employmentStatus,
        if (employmentStatusNote != null && employmentStatusNote!.isNotEmpty) 'employmentStatusNote': employmentStatusNote,
        if (employmentStartDate != null) 'employmentStartDate': employmentStartDate!.toIso8601String().split('T').first,
        if (incomeBand != null && incomeBand!.isNotEmpty) 'incomeBand': incomeBand,
        if (occupation != null && occupation!.isNotEmpty) 'occupation': occupation,
        if (employer != null && employer!.isNotEmpty) 'employer': employer,
        if (employerPhone != null && employerPhone!.isNotEmpty) 'employerPhone': employerPhone,
        if (employerEmail != null && employerEmail!.isNotEmpty) 'employerEmail': employerEmail,
        if (employerAddress != null && employerAddress!.isNotEmpty) 'employerAddress': employerAddress,
        if (natureOfBusiness != null && natureOfBusiness!.isNotEmpty) 'natureOfBusiness': natureOfBusiness,
        if (officeNumber != null && officeNumber!.isNotEmpty) 'officeNumber': officeNumber,
        if (officePhone != null && officePhone!.isNotEmpty) 'officePhone': officePhone,
        if (officeState != null && officeState!.isNotEmpty) 'officeState': officeState,
        if (officeLga != null && officeLga!.isNotEmpty) 'officeLga': officeLga,
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
    profileImageUrl: customer['photoUrl'] as String?,
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
