import { cn } from '@/lib/utils';
import { SITE } from '@/lib/site-content';

function AndroidLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 9.48l1.84-3.18c.16-.28.06-.64-.22-.8-.28-.16-.64-.06-.8.22l-1.87 3.24a9.64 9.64 0 00-4.55 0L9.03 5.72a.589.589 0 00-.8-.22c-.28.16-.38.52-.22.8l1.84 3.18a8.18 8.18 0 00-3.17 2.54 8.2 8.2 0 0011.9 0 8.18 8.18 0 00-3.17-2.54zM12 19.8a6.6 6.6 0 01-4.24-1.54l4.24-2.46 4.24 2.46A6.6 6.6 0 0112 19.8zm6.68-7.18a6.57 6.57 0 01-1.05 2.12l-4.13-2.39V8.04l4.05 2.35a6.5 6.5 0 01.13 2.23zm-13.36 0a6.5 6.5 0 01.13-2.23l4.05-2.35v4.31l-4.13 2.39a6.57 6.57 0 01-1.05-2.12z" />
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

      <a
        href={SITE.iosDownloadUrl}
        download
        className="inline-flex min-w-[220px] items-center gap-3 rounded-xl bg-gray-900 px-5 py-3.5 text-white shadow-sm transition hover:bg-gray-800 hover:shadow-md"
      >
        <AppleLogo className="h-8 w-8 shrink-0" />
        <div className="text-left">
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">Download for</p>
          <p className="text-base font-semibold leading-tight">iOS</p>
        </div>
      </a>
    </div>
  );
}

export function AppDownloadNotice() {
  return (
    <p className="text-xs leading-relaxed text-gray-500">
      Direct downloads are available while we prepare our Google Play and App Store listings.
      Only download from this official website.
    </p>
  );
}
