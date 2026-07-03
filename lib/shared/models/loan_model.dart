enum LoanStatus {
  draft,
  submitted,
  underReview,
  approved,
  rejected,
  disbursed,
  active,
  overdue,
  closed,
  writtenOff,
}

class LoanProductModel {
  const LoanProductModel({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    required this.minAmount,
    required this.maxAmount,
    required this.minTenureMonths,
    required this.maxTenureMonths,
    required this.interestRate,
    required this.processingFee,
    this.requiresCollateral = true,
  });

  final String id;
  final String code;
  final String name;
  final String? description;
  final double minAmount;
  final double maxAmount;
  final int minTenureMonths;
  final int maxTenureMonths;
  final double interestRate;
  final double processingFee;
  final bool requiresCollateral;

  factory LoanProductModel.fromJson(Map<String, dynamic> json) {
    return LoanProductModel(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      minAmount: (json['minAmount'] as num).toDouble(),
      maxAmount: (json['maxAmount'] as num).toDouble(),
      minTenureMonths: json['minTenureMonths'] as int,
      maxTenureMonths: json['maxTenureMonths'] as int,
      interestRate: (json['interestRate'] as num).toDouble(),
      processingFee: (json['processingFee'] as num?)?.toDouble() ?? 0,
      requiresCollateral: json['requiresCollateral'] as bool? ?? true,
    );
  }
}

class LoanScheduleItem {
  const LoanScheduleItem({
    required this.id,
    required this.installmentNumber,
    required this.dueDate,
    required this.totalDue,
    required this.paidAmount,
    required this.isPaid,
  });

  final String id;
  final int installmentNumber;
  final DateTime dueDate;
  final double totalDue;
  final double paidAmount;
  final bool isPaid;

  factory LoanScheduleItem.fromJson(Map<String, dynamic> json) {
    return LoanScheduleItem(
      id: json['id'] as String,
      installmentNumber: json['installmentNumber'] as int,
      dueDate: DateTime.parse(json['dueDate'] as String),
      totalDue: (json['totalDue'] as num).toDouble(),
      paidAmount: (json['paidAmount'] as num?)?.toDouble() ?? 0,
      isPaid: json['isPaid'] as bool? ?? false,
    );
  }
}

class LoanModel {
  const LoanModel({
    required this.id,
    required this.loanNumber,
    required this.status,
    required this.principalAmount,
    required this.interestRate,
    required this.tenureMonths,
    required this.monthlyPayment,
    required this.totalRepayable,
    required this.outstandingBalance,
    this.purpose,
    required this.productName,
    this.schedules = const [],
    this.submittedAt,
    this.disbursedAt,
    this.collateral,
    this.collateralType,
    this.collateralEstimatedValue,
    this.collateralVerifiedAt,
    this.guarantorName,
    this.guarantorPhone,
  });

  final String id;
  final String loanNumber;
  final LoanStatus status;
  final double principalAmount;
  final double interestRate;
  final int tenureMonths;
  final double monthlyPayment;
  final double totalRepayable;
  final double outstandingBalance;
  final String? purpose;
  final String productName;
  final List<LoanScheduleItem> schedules;
  final DateTime? submittedAt;
  final DateTime? disbursedAt;
  final String? collateral;
  final String? collateralType;
  final double? collateralEstimatedValue;
  final DateTime? collateralVerifiedAt;
  final String? guarantorName;
  final String? guarantorPhone;

  bool get isCollateralVerified => collateralVerifiedAt != null;

  LoanScheduleItem? get nextDueSchedule {
    for (final item in schedules) {
      if (!item.isPaid) return item;
    }
    return null;
  }

  bool get isPending =>
      status == LoanStatus.submitted || status == LoanStatus.underReview;

  bool get isActive =>
      status == LoanStatus.active ||
      status == LoanStatus.disbursed ||
      status == LoanStatus.overdue;

  double get totalPaid => schedules.fold(0, (sum, s) => sum + s.paidAmount);

  factory LoanModel.fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>?;
    final schedules = (json['schedules'] as List<dynamic>?) ?? [];

    return LoanModel(
      id: json['id'] as String,
      loanNumber: json['loanNumber'] as String,
      status: _parseStatus(json['status'] as String?),
      principalAmount: (json['principalAmount'] as num).toDouble(),
      interestRate: (json['interestRate'] as num).toDouble(),
      tenureMonths: json['tenureMonths'] as int,
      monthlyPayment: (json['monthlyPayment'] as num).toDouble(),
      totalRepayable: (json['totalRepayable'] as num).toDouble(),
      outstandingBalance: (json['outstandingBalance'] as num).toDouble(),
      purpose: json['purpose'] as String?,
      productName: product?['name'] as String? ?? 'Loan',
      schedules: schedules
          .map((s) => LoanScheduleItem.fromJson(s as Map<String, dynamic>))
          .toList(),
      submittedAt: json['submittedAt'] != null
          ? DateTime.parse(json['submittedAt'] as String)
          : null,
      disbursedAt: json['disbursedAt'] != null
          ? DateTime.parse(json['disbursedAt'] as String)
          : null,
      collateral: json['collateral'] as String?,
      collateralType: json['collateralType'] as String?,
      collateralEstimatedValue: (json['collateralEstimatedValue'] as num?)?.toDouble(),
      collateralVerifiedAt: json['collateralVerifiedAt'] != null
          ? DateTime.parse(json['collateralVerifiedAt'] as String)
          : null,
      guarantorName: json['guarantorName'] as String?,
      guarantorPhone: json['guarantorPhone'] as String?,
    );
  }

  static LoanStatus _parseStatus(String? raw) {
    return switch (raw) {
      'DRAFT' => LoanStatus.draft,
      'SUBMITTED' => LoanStatus.submitted,
      'UNDER_REVIEW' => LoanStatus.underReview,
      'APPROVED' => LoanStatus.approved,
      'REJECTED' => LoanStatus.rejected,
      'DISBURSED' => LoanStatus.disbursed,
      'ACTIVE' => LoanStatus.active,
      'OVERDUE' => LoanStatus.overdue,
      'CLOSED' => LoanStatus.closed,
      'WRITTEN_OFF' => LoanStatus.writtenOff,
      _ => LoanStatus.submitted,
    };
  }

  String get statusLabel => switch (status) {
        LoanStatus.draft => 'Draft',
        LoanStatus.submitted => 'Submitted',
        LoanStatus.underReview => 'Under review',
        LoanStatus.approved => 'Approved',
        LoanStatus.rejected => 'Rejected',
        LoanStatus.disbursed => 'Disbursed',
        LoanStatus.active => 'Active',
        LoanStatus.overdue => 'Overdue',
        LoanStatus.closed => 'Closed',
        LoanStatus.writtenOff => 'Written off',
      };
}
