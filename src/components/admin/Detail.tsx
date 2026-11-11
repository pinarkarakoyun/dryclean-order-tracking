import type { ReactNode } from "react";

// Shared building blocks of the admin detail pages (order, customer).

/** Green confirmation box shown after saving. */
export function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col gap-1 rounded-xl bg-green-100 p-4 text-green-950">
      <p className="text-lg font-bold">✓ {title}</p>
      {children && <p>{children}</p>}
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl font-bold">{title}</h2>
      <dl className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
        {children}
      </dl>
    </section>
  );
}

/** One label/value row. Shows `empty` (muted) when there is no value. */
export function DetailRow({
  label,
  empty,
  children,
}: {
  label: string;
  empty?: string;
  children: ReactNode;
}) {
  const hasValue = children !== null && children !== undefined && children !== false && children !== "";
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-lg">
        {hasValue ? children : <span className="text-muted italic">{empty}</span>}
      </dd>
    </div>
  );
}
