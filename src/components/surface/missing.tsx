import type { ReactNode } from "react";

/** Страница «не найдено»: заголовок, пояснение и куда идти дальше. */
export function SurfaceMissing({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children: ReactNode }) {
  return (
    <section className="sf-page-head sf-night sf-missing">
      <div className="sf-wrap">
        <p className="sf-eyebrow">{eyebrow}</p>
        <h1 className="sf-h-big">
          {title}
        </h1>
        <p className="sf-lead">{lead}</p>
        <div className="sf-controls">{children}</div>
      </div>
    </section>
  );
}
