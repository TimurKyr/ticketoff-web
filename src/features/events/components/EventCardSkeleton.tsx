/** Placeholder in the shape of an EventCard; the pulse stops with prefers-reduced-motion. */
export function EventCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <li aria-hidden="true" className={`flex flex-col gap-3 rounded-2xl bg-white p-3 ${className}`}>
      <div className="aspect-video rounded-xl bg-[#F5F4F1] motion-safe:animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-[#F5F4F1] motion-safe:animate-pulse" />
      <div className="h-5 w-4/5 rounded bg-[#F5F4F1] motion-safe:animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-[#F5F4F1] motion-safe:animate-pulse" />
    </li>
  );
}
