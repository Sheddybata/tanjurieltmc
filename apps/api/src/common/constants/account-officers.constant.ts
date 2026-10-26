import { AccountOfficer } from '@tanjuriel/database';

export const ACCOUNT_OFFICER_LABELS: Record<AccountOfficer, string> = {
  [AccountOfficer.FANNA_P_HELLEN_TANCIT]: 'Fannap Hellen Tancit',
  [AccountOfficer.YASON_BARBARA]: 'Yason Barbara',
  [AccountOfficer.DANLADI_DABANG_MERCY]: 'Danladi Dabang Mercy',
  [AccountOfficer.DAVID_VICTORIA]: 'David Victoria',
  [AccountOfficer.BALA_DANJUMA_LUSA]: 'Bala Danjuma Lusa',
  [AccountOfficer.DAVID_ADENOYI_PHILIP]: 'David Adenoyi Philip',
};

export const ACCOUNT_OFFICER_OPTIONS = Object.entries(ACCOUNT_OFFICER_LABELS).map(
  ([value, label]) => ({ value: value as AccountOfficer, label }),
);
