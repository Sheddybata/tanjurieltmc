import Link from 'next/link';
import { CalendarHeart, Baby, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavingsProductCardProps {
  id: string;
  name: string;
  headline: string;
  summary: string;
  features: string[];
  idealFor: string;
  accent: 'emerald' | 'amber';
  featured?: boolean;
}

const accentStyles = {
  emerald: {
    icon: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-100 hover:border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700',
    link: 'text-emerald-700 hover:text-emerald-800',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    border: 'border-amber-100 hover:border-amber-200',
    badge: 'bg-amber-50 text-amber-700',
    link: 'text-amber-700 hover:text-amber-800',
  },
};

export function SavingsProductCard({
  id,
  name,
  headline,
  summary,
  features,
  idealFor,
  accent,
  featured,
}: SavingsProductCardProps) {
  const styles = accentStyles[accent];
  const Icon = accent === 'emerald' ? CalendarHeart : Baby;

  return (
    <article
      id={id}
      className={cn(
        'scroll-mt-24 rounded-2xl border bg-white p-8 shadow-card transition hover:shadow-elevated',
        styles.border,
        featured && 'ring-2 ring-brand-500/20',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', styles.icon)}>
          <Icon className="h-6 w-6" />
        </div>
        {featured && (
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', styles.badge)}>
            Popular
          </span>
        )}
      </div>

      <h3 className="mt-5 font-display text-2xl font-bold text-gray-900">{name}</h3>
      <p className="mt-1 text-sm font-medium text-brand-600">{headline}</p>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">{summary}</p>

      <ul className="mt-6 space-y-2.5">
        {features.slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            {feature}
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs text-gray-500">
        <span className="font-medium text-gray-700">Ideal for:</span> {idealFor}
      </p>

      <Link
        href={`/personal/savings#${id}`}
        className={cn('mt-6 inline-flex items-center gap-1 text-sm font-semibold', styles.link)}
      >
        Learn more
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
