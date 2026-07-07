/// Dropdown options and labels for the loan application wizard.

class LoanApplicationOptions {
  LoanApplicationOptions._();

  static const locationTypes = ['RURAL', 'URBAN', 'SEMI_URBAN'];
  static const educationLevels = [
    'QURANIC',
    'PRIMARY',
    'JUNIOR_SECONDARY',
    'SENIOR_SECONDARY',
    'TERTIARY',
  ];
  static const maritalStatuses = [
    'MARRIED',
    'SINGLE',
    'DIVORCED',
    'WIDOWED',
    'LIVING_WITH_COMPANION',
  ];
  static const loanCategories = ['PERSONAL', 'BUSINESS', 'ASSET_FINANCING'];
  static const repaymentPlans = ['DAILY', 'WEEKLY', 'MONTHLY'];
  static const genders = ['MALE', 'FEMALE'];

  static const openingFee = 1000;
  static const upfrontFeeRate = 0.10;
  static const interestRate = 0.10;

  static String locationLabel(String value) => switch (value) {
        'RURAL' => 'Rural',
        'URBAN' => 'Urban',
        'SEMI_URBAN' => 'Semi-urban',
        _ => value,
      };

  static String educationLabel(String value) => switch (value) {
        'QURANIC' => 'Quranic school',
        'PRIMARY' => 'Primary',
        'JUNIOR_SECONDARY' => 'Junior secondary',
        'SENIOR_SECONDARY' => 'Senior secondary',
        'TERTIARY' => 'Tertiary',
        _ => value,
      };

  static String maritalLabel(String value) => switch (value) {
        'MARRIED' => 'Married',
        'SINGLE' => 'Single',
        'DIVORCED' => 'Divorced',
        'WIDOWED' => 'Widowed',
        'LIVING_WITH_COMPANION' => 'Living with companion',
        _ => value,
      };

  static String loanCategoryLabel(String value) => switch (value) {
        'PERSONAL' => 'Personal',
        'BUSINESS' => 'Business',
        'ASSET_FINANCING' => 'Asset financing',
        _ => value,
      };

  static String repaymentPlanLabel(String value) => switch (value) {
        'DAILY' => 'Daily',
        'WEEKLY' => 'Weekly',
        'MONTHLY' => 'Monthly',
        _ => value,
      };

  static String repaymentPeriodUnit(String value) => switch (value) {
        'DAILY' => 'days',
        'WEEKLY' => 'weeks',
        'MONTHLY' => 'months',
        _ => 'periods',
      };

  static String genderLabel(String value) => switch (value) {
        'MALE' => 'Male',
        'FEMALE' => 'Female',
        _ => value,
      };

  static int calculateAge(DateTime dob) {
    final today = DateTime.now();
    var age = today.year - dob.year;
    if (today.month < dob.month || (today.month == dob.month && today.day < dob.day)) {
      age--;
    }
    return age;
  }

  static Map<String, double> localQuote({
    required double principal,
    required int tenurePeriods,
  }) {
    final upfront = principal * upfrontFeeRate;
    final interest = principal * interestRate;
    final totalRepayable = principal + interest;
    final installment = tenurePeriods > 0 ? totalRepayable / tenurePeriods : totalRepayable;
    return {
      'openingFee': openingFee.toDouble(),
      'upfrontFee': upfront,
      'flatInterestAmount': interest,
      'totalRepayable': totalRepayable,
      'installmentAmount': installment,
      'netDisbursement': principal - upfront,
    };
  }
}
