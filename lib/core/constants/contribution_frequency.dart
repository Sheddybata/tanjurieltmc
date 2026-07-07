/// Contribution schedule for Daily Savings and Child Savings accounts.
abstract final class ContributionFrequency {
  static const daily = 'DAILY';
  static const weekly = 'WEEKLY';
  static const biWeekly = 'BI_WEEKLY';
  static const monthly = 'MONTHLY';

  static const all = [daily, weekly, biWeekly, monthly];

  static String label(String value) {
    return switch (value) {
      daily => 'Daily',
      weekly => 'Weekly',
      biWeekly => 'Bi-weekly',
      monthly => 'Monthly',
      _ => value.replaceAll('_', ' '),
    };
  }

  static String description(String value) {
    return switch (value) {
      daily => 'Contribute every day',
      weekly => 'Once every week',
      biWeekly => 'Every two weeks',
      monthly => 'Once a month',
      _ => '',
    };
  }
}
