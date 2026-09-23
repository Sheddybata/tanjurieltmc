import Image from 'next/image';
import { cn } from '@/lib/utils';

export function PhoneAppPreview({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn('relative mx-auto w-full max-w-[280px]', className)}>
      <div className="overflow-hidden rounded-[2.4rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl ring-1 ring-black/10">
        <Image
          src="/screenshot.jpeg"
          alt="Tanjuriel mobile app home screen with balance, quick actions, and recent transactions"
          width={540}
          height={1200}
          className="h-auto w-full"
          priority={priority}
        />
      </div>
    </div>
  );
}
