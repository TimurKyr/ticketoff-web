import { KeyboardEvent, ReactNode, useEffect, useId, useRef } from "react";

export interface TabSpec<T extends string> {
  id: T;
  label: string;
}

/**
 * WAI-ARIA tabs: one tab stop for the whole list (roving tabindex), ←/→ move and activate,
 * Home/End jump to the first/last tab. Only the active panel is rendered.
 */
export function EventTabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
  children,
}: {
  tabs: TabSpec<T>[];
  active: T;
  onChange: (tab: T) => void;
  label: string;
  children: ReactNode;
}) {
  const baseId = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const tabId = (tab: T) => `${baseId}-tab-${tab}`;
  const panelId = `${baseId}-panel`;

  // On a phone the strip scrolls sideways: keep the active tab visible (e.g. after a link to
  // ?tab=analytics). Only the strip moves; "nearest" never scrolls the page vertically.
  useEffect(() => {
    refs.current[active]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === active);
    const next =
      e.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : e.key === "ArrowLeft"
          ? (index - 1 + tabs.length) % tabs.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? tabs.length - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Scrolls sideways on a phone instead of wrapping into several rows. */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div
          role="tablist"
          aria-label={label}
          onKeyDown={onKeyDown}
          className="flex min-w-max gap-1 border-b border-gray-300"
        >
          {tabs.map((tab) => {
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  refs.current[tab.id] = el;
                }}
                id={tabId(tab.id)}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => onChange(tab.id)}
                className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 ${
                  selected ? "border-black font-semibold" : "border-transparent text-gray-700 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(active)} tabIndex={0} className="focus-visible:outline-none">
        {children}
      </div>
    </div>
  );
}
