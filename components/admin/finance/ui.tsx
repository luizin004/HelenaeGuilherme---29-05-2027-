import Link from "next/link";
import { STATUS_LABEL, type ContaStatus } from "@/domain/finance/status";

/** Badge padronizado dos status financeiros (§10) — cor única por status em TODAS as telas. */
const STATUS_STYLE: Record<ContaStatus, string> = {
  pago: "bg-[#e6efe0] text-success",
  parcial: "bg-[#eef1e6] text-olive",
  vencido: "bg-[#f4e2dc] text-danger",
  vence_hoje: "bg-[#f6ecd6] text-warn",
  a_pagar: "bg-cream text-moss",
  previsto: "bg-cream text-muted",
  cancelado: "bg-cream text-muted line-through",
  gratuito: "bg-gold-soft text-wood",
};

export function FinanceStatusBadge({ status }: { status: ContaStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Cabeçalho de página com breadcrumb, descrição e ações (§3). */
export function PageHeader({
  title,
  description,
  crumbs = [],
  actions,
}: {
  title: string;
  description?: string;
  crumbs?: { label: string; href: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-7">
      {crumbs.length > 0 && (
        <nav aria-label="Trilha de navegação" className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Link href="/admin" className="transition hover:text-moss">Painel</Link>
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              <Link href={c.href} className="transition hover:text-moss">{c.label}</Link>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-medium text-moss">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Card de indicador com tooltip explicativo e link filtrado (§11). */
export function SummaryCard({
  label,
  value,
  hint,
  tooltip,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tooltip?: string;
  href?: string;
  tone?: "default" | "success" | "warn" | "danger";
}) {
  const border =
    tone === "danger" ? "border-danger" : tone === "warn" ? "border-warn" : tone === "success" ? "border-success" : "border-olive";
  const inner = (
    <div
      title={tooltip}
      className={`h-full rounded-lg border-l-[3px] ${border} bg-white p-5 shadow-card transition ${href ? "hover:-translate-y-0.5 hover:shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-1 text-xs uppercase tracking-[0.08em] text-muted">
        {label}
        {tooltip && <span aria-hidden className="cursor-help text-[10px] opacity-60">ⓘ</span>}
      </div>
      <div className="mt-1 font-serif text-[1.65rem] leading-tight text-moss">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

/** Estado vazio orientativo (§11/§28). */
export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="font-serif text-xl text-moss">{title}</p>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

/** Barra horizontal proporcional (gráficos leves, sem dependência). */
export function Bar({ pct, tone = "olive" }: { pct: number; tone?: "olive" | "success" | "warn" | "danger" | "gold" }) {
  const cor =
    tone === "success" ? "bg-success" : tone === "warn" ? "bg-warn" : tone === "danger" ? "bg-danger" : tone === "gold" ? "bg-gold" : "bg-olive";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
      <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}
