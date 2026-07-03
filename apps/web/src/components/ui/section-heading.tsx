import { ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeading({ title, description, action }: SectionHeadingProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-gray-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
