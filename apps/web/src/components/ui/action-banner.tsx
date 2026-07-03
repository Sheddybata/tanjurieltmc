import Link from 'next/link';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionBannerProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  count?: number;
  variant?: 'warning' | 'info' | 'danger';
}

const VARIANTS = {
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  info: 'border-brand-200 bg-brand-50 text-brand-950',
  danger: 'border-red-200 bg-red-50 text-red-950',
};

const ICON_VARIANTS = {
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-brand-100 text-brand-700',
  danger: 'bg-red-100 text-red-700',
};

export function ActionBanner({ icon: Icon, title, description, href, count, variant = 'info' }: ActionBannerProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 rounded-xl border p-4 transition hover:shadow-card',
        VARIANTS[variant],
      )}
    >
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', ICON_VARIANTS[variant])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-sm font-semibold">{title}</p>
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold">{count}</span>
          )}
        </div>
        <p className="text-sm opacity-80">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}
