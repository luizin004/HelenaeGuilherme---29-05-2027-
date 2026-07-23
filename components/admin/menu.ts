export interface MenuItem {
  label: string;
  ico: string; // nome do ícone em components/admin/Icon.tsx
  href: string;
  soon?: boolean;
}
export type MenuEntry = { section: string } | MenuItem;

export const ADMIN_MENU: MenuEntry[] = [
  { section: "Visão geral" },
  { label: "Dashboard", ico: "dashboard", href: "/admin" },

  { section: "Convidados" },
  { label: "Lista de convidados", ico: "list", href: "/admin/convidados" },
  { label: "Grupos familiares", ico: "users", href: "/admin/grupos" },
  { label: "Espaço infantil", ico: "child", href: "/admin/infantil" },
  { label: "Transporte", ico: "bus", href: "/admin/transporte" },
  { label: "Check-in", ico: "scan", href: "/admin/checkin" },

  { section: "Comunicação" },
  { label: "Comunicação (Evania)", ico: "megaphone", href: "/admin/comunicacao" },
  { label: "Padrinhos & madrinhas", ico: "rings", href: "/admin/padrinhos" },

  { section: "Presentes" },
  { label: "Lista de presentes", ico: "gift", href: "/admin/presentes" },
  { label: "Pagamentos (Asaas)", ico: "card", href: "/admin", soon: true },

  { section: "Financeiro" },
  { label: "Dashboard financeiro", ico: "dashboard", href: "/admin/financeiro-dashboard" },
  { label: "Orçamento", ico: "calculator", href: "/admin/orcamento" },
  { label: "Cotações e propostas", ico: "file-text", href: "/admin/cotacoes" },
  { label: "Lançamentos", ico: "wallet", href: "/admin/financeiro" },
  { label: "Contas", ico: "clock", href: "/admin/contas" },
  { label: "Calendário financeiro", ico: "calendar-check", href: "/admin/calendario" },
  { label: "Fluxo de caixa", ico: "coins", href: "/admin/fluxo-caixa" },
  { label: "Evania (assistente)", ico: "heart", href: "/admin/evania" },

  { section: "Movimentações especiais" },
  { label: "Aportes", ico: "plus-circle", href: "/admin/aportes" },
  { label: "Reembolsos", ico: "refresh", href: "/admin/reembolsos" },
  { label: "Cortesias", ico: "award", href: "/admin/cortesias" },

  { section: "Análises e documentos" },
  { label: "Relatórios", ico: "chart", href: "/admin/relatorios" },
  { label: "Comprovantes", ico: "receipt", href: "/admin/comprovantes" },
  { label: "Documentação & cotação", ico: "folder", href: "/admin/documentos" },

  { section: "Configurações financeiras" },
  { label: "Classificações financeiras", ico: "tag", href: "/admin/classificacoes" },
  { label: "Fornecedores", ico: "handshake", href: "/admin/fornecedores" },
  { label: "Contratos", ico: "file-text", href: "/admin/contratos" },
  { label: "Métodos de pagamento", ico: "card", href: "/admin/metodos-pagamento" },
  { label: "Contas financeiras", ico: "bank", href: "/admin/contas-financeiras" },
  { label: "Divisão por responsável", ico: "percent", href: "/admin/divisao" },
  { label: "Responsáveis", ico: "users", href: "/admin/responsaveis" },

  { section: "Site & operação" },
  { label: "Leads (Rancho)", ico: "inbox", href: "/admin/leads" },
  { label: "Conteúdo (CMS)", ico: "edit", href: "/admin/conteudo" },
  { label: "Locais & mapa", ico: "pin", href: "/admin/locais" },
  { label: "Plano de chuva", ico: "rain", href: "/admin/plano-chuva" },

  { section: "Segurança" },
  { label: "Usuários & acesso", ico: "lock", href: "/admin/usuarios" },
  { label: "Auditoria", ico: "search", href: "/admin/auditoria" },
];

export function isSection(e: MenuEntry): e is { section: string } {
  return "section" in e;
}
