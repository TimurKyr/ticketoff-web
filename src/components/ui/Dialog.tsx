import { ReactNode, useEffect, useId, useRef } from "react";

/**
 * Modal dialog on the native <dialog> element: the rest of the page is inert and focus
 * stays inside; Esc and a click on the backdrop close it. Mount it only while it is open
 * and close it by unmounting (the parent clears its state in `onClose`).
 *
 * Focus starts on the element marked `data-autofocus` (else the first focusable one) and
 * goes back to whatever had it before the dialog opened.
 */
export function Dialog({
  title,
  onClose,
  children,
  className = "max-w-md",
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Width, e.g. "max-w-lg". */
  className?: string;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    // Guard: StrictMode runs this effect twice in development.
    if (dialog && !dialog.open) dialog.showModal();
    dialog?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      // Closed by unmounting (a button, the backdrop): leave modal mode first, else the
      // page is still inert and the opener cannot take focus back.
      if (dialog?.open) dialog.close();
      opener?.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Esc closes the native dialog; the parent then unmounts it. The event is queued, so
      // it can arrive after StrictMode's dev re-run has opened the dialog again: only a
      // dialog that is really closed counts.
      onClose={() => !ref.current?.open && onClose()}
      // The <dialog> itself is only hit outside the panel, i.e. on the backdrop.
      onClick={(e) => e.target === ref.current && onClose()}
      className={`w-full rounded-lg p-0 shadow-lg backdrop:bg-black/40 ${className}`}
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
