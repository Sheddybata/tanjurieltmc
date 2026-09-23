import { cn } from '@/lib/utils';
import { SITE } from '@/lib/site-content';

function AndroidLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.523 15.341c-.551 0-.999-.448-.999-1s.448-.999.999-.999.999.448.999.999-.448 1-.999 1m-11.046 0c-.551 0-.999-.448-.999-1s.448-.999.999-.999.999.448.999.999-.448 1-.999 1m11.405-6.02l1.997-3.459a.416.416 0 00-.152-.568.416.416 0 00-.568.152l-2.022 3.503A9.88 9.88 0 0012 7.682c-1.853 0-3.59.562-5.137 1.748L4.841 5.927a.416.416 0 00-.568-.152.416.416 0 00-.152.568l1.997 3.459C2.689 11.187.343 14.659 0 18.761h24c-.343-4.102-2.689-7.574-6.118-9.44" />
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

interface AppDownloadButtonsProps {
  layout?: 'row' | 'column';
  className?: string;
}

export function AppDownloadButtons({ layout = 'row', className }: AppDownloadButtonsProps) {
  const stack = layout === 'column';

  return (
    <div className={cn('flex flex-wrap gap-4', stack && 'flex-col', className)}>
      <a
        href={SITE.androidDownloadUrl}
        download
        className="inline-flex min-w-[220px] items-center gap-3 rounded-xl bg-[#3DDC84] px-5 py-3.5 text-white shadow-sm transition hover:bg-[#34c975] hover:shadow-md"
      >
        <AndroidLogo className="h-8 w-8 shrink-0" />
        <div className="text-left">
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/80">Download for</p>
          <p className="text-base font-semibold leading-tight">Android</p>
        </div>
      </a>

      <div
        aria-disabled="true"
        className="inline-flex min-w-[220px] cursor-not-allowed items-center gap-3 rounded-xl bg-gray-200 px-5 py-3.5 text-gray-500"
      >
        <AppleLogo className="h-8 w-8 shrink-0 text-gray-400" />
        <div className="text-left">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Coming soon</p>
          <p className="text-base font-semibold leading-tight text-gray-600">iOS</p>
        </div>
      </div>
    </div>
  );
}

export function AppDownloadNotice() {
  return (
    <p className="text-xs leading-relaxed text-gray-500">
      The Android app is available to download now. The iOS build is coming soon.
      Only download from this official website.
    </p>
  );
}
