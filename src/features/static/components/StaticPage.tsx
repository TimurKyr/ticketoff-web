import type { ReactNode } from "react";

import { useDocumentTitle } from "@/lib/useDocumentTitle";

import type { Section } from "../content";

/** Readable text column shared by the static pages. */
export function StaticPage({
  title,
  lead,
  actions,
  children,
}: {
  title: string;
  lead: string;
  /** Under the lead: what to do next (the /organizers call to action). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  useDocumentTitle(title);
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
      <p className="mb-6 text-gray-700">{lead}</p>
      {actions && <div className="mb-6">{actions}</div>}
      <div className="flex flex-col gap-6">{children}</div>
    </article>
  );
}

export function StaticSection({ section }: { section: Section }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{section.title}</h2>
      {section.paragraphs?.map((p) => (
        <p key={p} className="mb-2 leading-relaxed text-gray-800">
          {p}
        </p>
      ))}
      {section.items && (
        <ul className="list-disc space-y-1 pl-5 leading-relaxed text-gray-800">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
