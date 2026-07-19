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
  { section: "Financeiro" },
  { label: "Evania (assistente)", ico: "💌", href: "/admin/evania" },
  { label: "Dashboard financeiro", ico: "📉", href: "/admin/financeiro-dashboard" },
  { label: "Montar orçamento", ico: "🧮", href: "/admin/orcamento" },
  { label: "Cotações & propostas", ico: "📝", href: "/admin/cotacoes" },
  { label: "Lançamentos", ico: "💰", href: "/admin/financeiro" },
  { label: "Contas a pagar", ico: "⏳", href: "/admin/contas-a-pagar" },
  { label: "Contas pagas", ico: "✅", href: "/admin/contas-pagas" },
  { label: "Calendário financeiro", ico: "📅", href: "/admin/calendario" },
  { label: "Parcelas", ico: "📆", href: "/admin/parcelas" },
  { label: "Projeção mensal", ico: "📈", href: "/admin/projecao" },
  { label: "Fluxo de caixa", ico: "💵", href: "/admin/fluxo-caixa" },
  { label: "Aportes", ico: "➕", href: "/admin/aportes" },
  { label: "Reembolsos", ico: "🔄", href: "/admin/reembolsos" },
  { label: "Cortesias", ico: "🎗️", href: "/admin/cortesias" },
  { label: "Relatórios", ico: "📊", href: "/admin/relatorios" },
  { label: "Comprovantes", ico: "🧾", href: "/admin/comprovantes" },
  { section: "Classificação" },
  { label: "Centros de custo", ico: "🗂️", href: "/admin/centros-custo" },
  { label: "Divisão por responsável", ico: "➗", href: "/admin/divisao" },
  { label: "Responsáveis", ico: "👥", href: "/admin/responsaveis" },
  { section: "Fornecedores & contratos" },
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
