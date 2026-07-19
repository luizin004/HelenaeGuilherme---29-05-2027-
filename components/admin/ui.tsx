export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-6 font-serif text-3xl font-medium text-moss">{children}</h1>;
}

export function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border-l-[3px] border-olive bg-white p-6 shadow-card">
      <div className="text-xs uppercase tracking-[0.1em] text-muted">{label}</div>
      <div className="mt-1 font-serif text-4xl leading-none text-moss">{value}</div>
      {hint && <div className="mt-1 text-sm text-muted">{hint}</div>}
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

const BADGE: Record<string, string> = {
  confirmado: "bg-[#e6efe0] text-success",
  pendente: "bg-[#f6ecd6] text-warn",
  recusado: "bg-[#f4e2dc] text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs uppercase tracking-wide ${BADGE[status] ?? "bg-cream text-muted"}`}>
      {status}
    </span>
  );
}

export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mb-8 overflow-hidden rounded-lg bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h2 className="font-serif text-2xl text-moss">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-lg bg-gold-soft px-5 py-4 text-sm text-moss">{children}</div>
  );
}
