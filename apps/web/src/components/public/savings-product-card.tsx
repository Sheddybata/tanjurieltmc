import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavingsProductCardProps {
  id: string;
  name: string;
  headline: string;
  summary: string;
  features: string[];
  idealFor: string;
  accent: 'emerald' | 'amber';
  image: string;
  featured?: boolean;
}

const accentStyles = {
  emerald: {
    border: 'border-emerald-100 hover:border-emerald-200',
    badge: 'bg-emerald-500/90 text-white',
    link: 'text-emerald-700 hover:text-emerald-800',
    overlay: 'from-brand-950/85 via-brand-900/45 to-brand-800/20',
  },
  amber: {
    border: 'border-amber-100 hover:border-amber-200',
    badge: 'bg-amber-500/90 text-white',
    link: 'text-amber-700 hover:text-amber-800',
    overlay: 'from-gray-950/85 via-gray-900/45 to-amber-900/20',
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
  image,
  featured,
}: SavingsProductCardProps) {
  const styles = accentStyles[accent];

  return (
    <article
      id={id}
      className={cn(
        'scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-card transition hover:shadow-elevated',
        styles.border,
        featured && 'ring-2 ring-brand-500/20',
      )}
    >
      <div className="relative h-52 sm:h-56">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={featured}
        />
        <div className={cn('absolute inset-0 bg-gradient-to-t', styles.overlay)} />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">{name}</h3>
              <p className="mt-1 text-sm font-medium text-white/90">{headline}</p>
            </div>
            {featured && (
              <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold', styles.badge)}>
                Popular
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        <p className="text-sm leading-relaxed text-gray-600">{summary}</p>

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
          href={`/personal/savings/${id}`}
          className={cn('mt-6 inline-flex items-center gap-1 text-sm font-semibold', styles.link)}
        >
          Learn more
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
