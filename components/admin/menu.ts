export interface MenuItem {
  label: string;
  ico: string;
  href: string;
  soon?: boolean;
}
export type MenuEntry = { section: string } | MenuItem;

export const ADMIN_MENU: MenuEntry[] = [
  { section: "Visão geral" },
  { label: "Dashboard", ico: "📊", href: "/admin" },
  { section: "Convidados" },
  { label: "Lista de convidados", ico: "📋", href: "/admin/convidados" },
  { label: "Espaço infantil", ico: "🧸", href: "/admin/convidados", soon: true },
  { label: "Check-in", ico: "📷", href: "/admin/checkin" },
  { label: "Comunicação", ico: "✉️", href: "/admin", soon: true },
  { section: "Presentes" },
  { label: "Lista de presentes", ico: "🎁", href: "/admin", soon: true },
  { label: "Pagamentos (Asaas)", ico: "💳", href: "/admin", soon: true },
  { section: "Gestão" },
  { label: "Controle financeiro", ico: "💰", href: "/admin/financeiro" },
  { label: "Projeção mensal", ico: "📈", href: "/admin/financeiro", soon: true },
  { label: "Fornecedores", ico: "🤝", href: "/admin/fornecedores" },
  { label: "Contratos", ico: "📄", href: "/admin/contratos" },
  { label: "Documentos", ico: "🗂️", href: "/admin", soon: true },
  { section: "Site" },
  { label: "Conteúdo (CMS)", ico: "📝", href: "/admin/conteudo" },
  { section: "Segurança" },
  { label: "Auditoria", ico: "🔎", href: "/admin/auditoria" },
];

export function isSection(e: MenuEntry): e is { section: string } {
  return "section" in e;
}
