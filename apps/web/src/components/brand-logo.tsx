import Image from 'next/image';
import { cn } from '@/lib/utils';

const LOGO_WIDTH = 402;
const LOGO_HEIGHT = 487;

export function BrandLogo({
  height = 40,
  className,
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round((height * LOGO_WIDTH) / LOGO_HEIGHT);

  return (
    <Image
      src="/tanjuriel.jpg"
      alt="Tanjuriel"
      width={width}
      height={height}
      priority={priority}
      className={cn('object-contain', className)}
    />
  );
}
