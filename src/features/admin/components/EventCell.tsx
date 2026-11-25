import { useEvent } from "@/features/events/api";

const shortId = (id: string) => id.slice(0, 8);

/**
 * An event in the admin tables (FE-22 #16): its title instead of a UUID. Uses `event_title`
 * when the API sends one (BE-37); until then the public event is looked up (cached, so one
 * request per event), and a private or missing one stays a short id.
 */
export function EventCell({ id, title }: { id: string | null; title?: string | null }) {
  const event = useEvent(title || !id ? "" : id);
  if (!id) return <span>—</span>;
  const name = title ?? event.data?.title;
  return name ? (
    <span className="block max-w-[16rem] truncate" title={shortId(id)}>
      {name}
    </span>
  ) : (
    <span className="font-mono text-xs" title={id}>
      {shortId(id)}
    </span>
  );
}
