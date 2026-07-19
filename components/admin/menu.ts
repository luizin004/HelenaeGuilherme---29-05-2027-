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
  { label: "Espaço infantil", ico: "🧸", href: "/admin/infantil" },
  { label: "Check-in", ico: "📷", href: "/admin/checkin" },
  { label: "Comunicação", ico: "✉️", href: "/admin/comunicacao" },
  { section: "Presentes" },
  { label: "Lista de presentes", ico: "🎁", href: "/admin/presentes" },
  { label: "Pagamentos (Asaas)", ico: "💳", href: "/admin", soon: true },
  { section: "Gestão" },
  { label: "Montar orçamento", ico: "🧮", href: "/admin/orcamento" },
  { label: "Controle financeiro", ico: "💰", href: "/admin/financeiro" },
  { label: "Parcelas", ico: "📆", href: "/admin/parcelas" },
  { label: "Fornecedores", ico: "🤝", href: "/admin/fornecedores" },
  { label: "Contratos", ico: "📄", href: "/admin/contratos" },
  { label: "Documentos", ico: "🗂️", href: "/admin/documentos" },
  { section: "Site" },
  { label: "Conteúdo (CMS)", ico: "📝", href: "/admin/conteudo" },
  { section: "Segurança" },
  { label: "Auditoria", ico: "🔎", href: "/admin/auditoria" },
];

export function isSection(e: MenuEntry): e is { section: string } {
  return "section" in e;
}
