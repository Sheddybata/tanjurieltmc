export const CONTRIBUTION_FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
};

export const CONTRIBUTION_FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BI_WEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
] as const;

export function contributionFrequencyLabel(value?: string | null): string {
  if (!value) return '—';
  return CONTRIBUTION_FREQUENCY_LABELS[value] ?? value.replace(/_/g, ' ');
}
