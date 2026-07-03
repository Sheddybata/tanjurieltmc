import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}

export function PageShell({ children, className, wide }: PageShellProps) {
  return <div className={cn(wide ? 'page-content-wide' : 'page-content', className)}>{children}</div>;
}
