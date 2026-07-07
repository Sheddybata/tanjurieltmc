'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';

export interface AccountOption {
  accountId: string;
  accountNumber: string;
  customerName: string;
  customerPhone: string;
  balance?: number;
  accountType?: string;
  label?: string;
}

interface AccountSearchSelectProps {
  value: string;
  onChange: (accountId: string, option: AccountOption | null) => void;
  label?: string;
  accountTypeFilter?: string;
  prefill?: AccountOption | null;
}

interface CustomerResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  accounts: { id: string; accountNumber: string; balance?: number; type?: string; label?: string }[];
}

export function AccountSearchSelect({
  value,
  onChange,
  label = 'Customer account',
  accountTypeFilter,
  prefill,
}: AccountSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AccountOption | null>(null);

  useEffect(() => {
    if (!prefill || value) return;
    setSelected(prefill);
    setQuery(prefill.label ? `${prefill.accountNumber} (${prefill.label})` : prefill.accountNumber);
    onChange(prefill.accountId, prefill);
  }, [prefill, value, onChange]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<{ success: boolean; data: CustomerResult[] }>(
          `/teller/customers?query=${encodeURIComponent(query.trim())}&limit=10`,
        );
        const flat: AccountOption[] = [];
        for (const c of res.data ?? []) {
          for (const a of c.accounts ?? []) {
            if (accountTypeFilter && a.type !== accountTypeFilter) continue;
            flat.push({
              accountId: a.id,
              accountNumber: a.accountNumber,
              customerName: `${c.firstName} ${c.lastName}`,
              customerPhone: c.phone,
              balance: a.balance,
              accountType: a.type,
              label: a.label,
            });
          }
        }
        setOptions(flat);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, accountTypeFilter]);

  function pick(option: AccountOption) {
    setSelected(option);
    setQuery(option.accountNumber);
    setOptions([]);
    onChange(option.accountId, option);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) {
              setSelected(null);
              onChange('', null);
            }
          }}
          placeholder="Search by account number, phone, or name"
          className="input-field w-full pl-10"
        />
      </div>
      {loading && <p className="text-xs text-gray-500">Searching…</p>}
      {options.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          {options.map((o) => (
            <li key={o.accountId}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => pick(o)}
              >
                <span className="font-mono text-brand-700">{o.accountNumber}</span>
                <span className="ml-2 text-gray-600">{o.customerName}</span>
                {o.label && <span className="ml-1 text-xs text-amber-700">({o.label})</span>}
                <span className="block text-xs text-gray-400">{o.customerPhone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && value && (
        <p className="text-xs text-emerald-700">
          Selected: {selected.accountNumber} — {selected.customerName}
        </p>
      )}
    </div>
  );
}
