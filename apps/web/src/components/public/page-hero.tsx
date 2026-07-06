import { ReactNode } from 'react';

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  compact?: boolean;
}

export function PageHero({ eyebrow, title, description, children, compact }: PageHeroProps) {
  return (
    <section
      className={
        compact
          ? 'bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-4 py-14 sm:px-6 lg:px-8'
          : 'bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-28'
      }
    >
      <div className="mx-auto max-w-7xl">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">{eyebrow}</p>
        )}
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-brand-100">{description}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
