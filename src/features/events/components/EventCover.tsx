import { useId, useState, type ReactNode } from "react";

import { useI18n } from "@/lib/i18n";

import { categoryLabelKey, toCategory, type Category } from "../categories";

// The event's own image (R-12) when it has one and it loads; otherwise a generated cover: the category's tone (--cover-<cat>-bg/fg in
// index.css, contrast ≥ 7:1 even over the pattern), a thin pattern of the category and the
// title. The pattern's angle and offset come from a hash of the event id, so covers of one
// category differ but stay the same between reloads. Decorative: the card repeats the text.

/** FNV-1a: small, stable across browsers. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const ANGLES = [0, 18, -24, 32, -12, 45];

const PATTERNS: Record<Category, { width: number; height: number; shape: ReactNode }> = {
  // waves
  music: {
    width: 64,
    height: 20,
    shape: <path d="M0 10 Q16 0 32 10 T64 10" fill="none" stroke="currentColor" strokeWidth="1.5" />,
  },
  // arcs
  theatre: {
    width: 56,
    height: 28,
    shape: (
      <path
        d="M0 28 A28 28 0 0 1 56 28 M14 28 A14 14 0 0 1 42 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    ),
  },
  // dot grid
  education: {
    width: 14,
    height: 14,
    shape: <circle cx="7" cy="7" r="1.6" fill="currentColor" />,
  },
  // diagonals (the angle is added below)
  sport: {
    width: 12,
    height: 12,
    shape: <path d="M6 0 V12" stroke="currentColor" strokeWidth="2" />,
  },
  // circles
  kids: {
    width: 44,
    height: 44,
    shape: (
      <>
        <circle cx="22" cy="22" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="6" r="3" fill="currentColor" />
      </>
    ),
  },
  // grid
  other: {
    width: 22,
    height: 22,
    shape: <path d="M22 0 H0 V22" fill="none" stroke="currentColor" strokeWidth="1" />,
  },
};

interface EventCoverProps {
  event: { id: string; title: string; category?: string | null; image_url?: string | null };
  /** "card": 16:9 on top of a card; "banner": wide strip on the event page */
  variant?: "card" | "banner";
  className?: string;
}

export function EventCover({ event, variant = "card", className = "" }: EventCoverProps) {
  // A broken image (e.g. a private event's URL without a token) falls back to the generated one.
  const [failed, setFailed] = useState<string | null>(null);
  if (event.image_url && failed !== event.image_url) {
    return (
      <img
        src={event.image_url}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={() => setFailed(event.image_url ?? null)}
        className={`w-full rounded-xl object-cover ${
          variant === "card" ? "aspect-video" : "aspect-[3/1] sm:aspect-[4/1]"
        } ${className}`}
      />
    );
  }
  return <GeneratedCover event={event} variant={variant} className={className} />;
}

function GeneratedCover({ event, variant = "card", className = "" }: EventCoverProps) {
  const { t } = useI18n();
  // useId gives ":r1:"; colons are awkward inside url(#…)
  const patternId = `cover${useId().replace(/:/g, "")}`;
  const category = toCategory(event.category);
  const pattern = PATTERNS[category];
  const hash = hashString(event.id);
  const angle = ANGLES[hash % ANGLES.length] + (category === "sport" ? 45 : 0);
  const dx = (hash >>> 4) % pattern.width;
  const dy = (hash >>> 12) % pattern.height;

  return (
    <div
      aria-hidden="true"
      className={`relative isolate flex flex-col justify-end overflow-hidden rounded-xl ${
        variant === "card" ? "aspect-video p-3" : "aspect-[3/1] p-4 sm:aspect-[4/1] sm:p-6"
      } ${className}`}
      style={{
        backgroundColor: `var(--cover-${category}-bg)`,
        color: `var(--cover-${category}-fg)`,
      }}
    >
      <svg className="absolute inset-0 -z-10 h-full w-full opacity-10" focusable="false">
        <defs>
          <pattern
            id={patternId}
            width={pattern.width}
            height={pattern.height}
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${angle}) translate(${dx} ${dy})`}
          >
            {pattern.shape}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <span className="text-xs font-medium">{t(categoryLabelKey(event.category))}</span>
      <span
        className={`font-semibold leading-tight ${
          variant === "card" ? "line-clamp-2 text-lg" : "line-clamp-2 text-xl sm:text-2xl"
        }`}
      >
        {event.title}
      </span>
    </div>
  );
}
