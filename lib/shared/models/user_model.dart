import 'package:tanjuriel_microfinance/core/utils/json_utils.dart';

enum KycStatus {
  notStarted,
  bvnPending,
  bvnVerified,
  ninPending,
  ninVerified,
  faceCapturePending,
  underReview,
  approved,
  rejected,
}

class UserModel {
  const UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.accountNumber,
    this.accountId,
    this.paymentRef,
    this.accountType,
    this.kycStatus = KycStatus.notStarted,
    this.bvnVerified = false,
    this.ninVerified = false,
    this.profileImageUrl,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String accountNumber;
  final String? accountId;
  final String? paymentRef;
  final String? accountType;
  final KycStatus kycStatus;
  final bool bvnVerified;
  final bool ninVerified;
  final String? profileImageUrl;

  String get fullName => '$firstName $lastName';

  bool get isKycComplete => kycStatus == KycStatus.approved;

  UserModel copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? accountNumber,
    String? accountId,
    String? paymentRef,
    String? accountType,
    KycStatus? kycStatus,
    bool? bvnVerified,
    bool? ninVerified,
    String? profileImageUrl,
  }) {
    return UserModel(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      accountNumber: accountNumber ?? this.accountNumber,
      accountId: accountId ?? this.accountId,
      paymentRef: paymentRef ?? this.paymentRef,
      accountType: accountType ?? this.accountType,
      kycStatus: kycStatus ?? this.kycStatus,
      bvnVerified: bvnVerified ?? this.bvnVerified,
      ninVerified: ninVerified ?? this.ninVerified,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String,
      accountNumber: json['account_number'] as String,
      kycStatus: KycStatus.values.byName(json['kyc_status'] as String? ?? 'notStarted'),
      bvnVerified: json['bvn_verified'] as bool? ?? false,
      ninVerified: json['nin_verified'] as bool? ?? false,
      profileImageUrl: json['profile_image_url'] as String?,
    );
  }
}

class AccountBalance {
  const AccountBalance({
    required this.available,
    required this.ledger,
    required this.currency,
  });

  final double available;
  final double ledger;
  final String currency;

  factory AccountBalance.fromJson(Map<String, dynamic> json) {
    return AccountBalance(
      available: JsonUtils.parseDouble(json['available']),
      ledger: JsonUtils.parseDouble(json['ledger']),
      currency: json['currency'] as String? ?? 'NGN',
    );
  }
}
