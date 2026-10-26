export const ACCOUNT_OFFICERS = [
  { value: 'FANNA_P_HELLEN_TANCIT', label: 'Fannap Hellen Tancit' },
  { value: 'YASON_BARBARA', label: 'Yason Barbara' },
  { value: 'DANLADI_DABANG_MERCY', label: 'Danladi Dabang Mercy' },
  { value: 'DAVID_VICTORIA', label: 'David Victoria' },
  { value: 'BALA_DANJUMA_LUSA', label: 'Bala Danjuma Lusa' },
  { value: 'DAVID_ADENOYI_PHILIP', label: 'David Adenoyi Philip' },
] as const;

export type AccountOfficerCode = (typeof ACCOUNT_OFFICERS)[number]['value'];

export function accountOfficerLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return ACCOUNT_OFFICERS.find((o) => o.value === code)?.label ?? code.replace(/_/g, ' ');
}
