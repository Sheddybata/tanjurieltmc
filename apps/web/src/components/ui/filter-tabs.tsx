import { cn } from '@/lib/utils';

export interface FilterTab {
  id: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function FilterTabs({ tabs, active, onChange, className }: FilterTabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition',
            active === tab.id
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                active === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
