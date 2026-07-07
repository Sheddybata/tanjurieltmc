import Image from 'next/image';
import { MISSION_VISION } from '@/lib/site-content';

interface MissionVisionCardProps {
  label: string;
  text: string;
  image: string;
}

function MissionVisionCard({ label, text, image }: MissionVisionCardProps) {
  return (
    <article className="relative min-h-[320px] overflow-hidden rounded-2xl sm:min-h-[360px]">
      <Image
        src={image}
        alt={label}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/10" />
      <div className="relative flex h-full min-h-[320px] items-end p-5 sm:min-h-[360px] sm:p-6">
        <div className="w-full rounded-xl border border-white/40 bg-white/70 p-6 shadow-lg backdrop-blur-md backdrop-saturate-150 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">{label}</p>
          <p className="mt-3 font-display text-lg font-bold leading-relaxed text-gray-900 sm:text-xl">
            {text}
          </p>
        </div>
      </div>
    </article>
  );
}

export function MissionVisionCards() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <MissionVisionCard label="Mission" text={MISSION_VISION.mission} image={MISSION_VISION.missionImage} />
      <MissionVisionCard label="Vision" text={MISSION_VISION.vision} image={MISSION_VISION.visionImage} />
    </div>
  );
}
