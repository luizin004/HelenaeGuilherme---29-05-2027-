import { createClient } from "@/lib/supabase/server";

// ============================================================
// Padrinhos / madrinhas
// ============================================================
export interface PartyMember {
  id: string;
  guest_id: string | null;
  nome: string;
  papel: "padrinho" | "madrinha";
  lado: string | null;
  telefone: string | null;
  instagram: string | null;
  cidade: string | null;
  relacao: string | null;
  status: string;
  traje_status: string;
  ensaio_status: string;
  hospedagem_status: string;
  transporte_status: string;
  observacao: string | null;
  ordem: number;
  criado_em: string;
}

export async function listPadrinhos(): Promise<PartyMember[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_wedding_party")
    .select("*")
    .is("deleted_at", null)
    .order("ordem")
    .order("nome");
  return (data ?? []) as PartyMember[];
}

export async function getPadrinho(id: string): Promise<PartyMember | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("hg_wedding_party")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as PartyMember) ?? null;
}

export interface PartyPendencias {
  total: number;
  semTelefone: number;
  semConfirmacao: number;
  trajePendente: number;
  medidasPendentes: number;
  ensaioPendente: number;
  hospedagemPendente: number;
  transportePendente: number;
}

export async function getPadrinhosPendencias(): Promise<PartyPendencias> {
  const membros = await listPadrinhos();
  return {
    total: membros.length,
    semTelefone: membros.filter((m) => !m.telefone).length,
    semConfirmacao: membros.filter((m) => m.status !== "confirmado").length,
    trajePendente: membros.filter((m) => m.traje_status !== "confirmado").length,
    medidasPendentes: membros.filter(
      (m) => m.traje_status === "pendente" || m.traje_status === "medidas_solicitadas",
    ).length,
    ensaioPendente: membros.filter((m) => m.ensaio_status !== "confirmado").length,
    hospedagemPendente: membros.filter((m) => m.hospedagem_status === "pendente").length,
    transportePendente: membros.filter((m) => m.transporte_status === "pendente").length,
  };
}

export interface PartyTask {
  id: string;
  member_id: string | null;
  titulo: string;
  descricao: string | null;
  responsavel: string | null;
  status: string;
  prioridade: string;
  prazo: string | null;
  criado_em: string;
}

export async function listPartyTasks(): Promise<PartyTask[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_wedding_party_tasks")
    .select("*")
    .order("criado_em", { ascending: false });
  return (data ?? []) as PartyTask[];
}

export interface Commitment {
  id: string;
  member_id: string | null;
  tipo: string;
  titulo: string;
  quando: string | null;
  local: string | null;
  status: string;
  observacao: string | null;
}

export async function listCommitments(): Promise<Commitment[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_wedding_party_commitments")
    .select("*")
    .order("quando", { ascending: true, nullsFirst: false });
  return (data ?? []) as Commitment[];
}

// ============================================================
// Jornadas
// ============================================================
export interface Journey {
  id: string;
  chave: string;
  nome: string;
  objetivo: string | null;
  publico: string | null;
  canais: string;
  aprovacao: string;
  limite_freq_dias: number;
  ativa: boolean;
  ordem: number;
}
export interface JourneyStage {
  id: string;
  journey_id: string;
  ordem: number;
  fase: number | null;
  nome: string;
  objetivo: string | null;
  tipo_mensagem: string | null;
  intervalo_min_dias: number;
  canal: string;
  aprovacao: string;
  ativa: boolean;
}

export async function listJourneys(): Promise<Journey[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_comm_journeys").select("*").order("ordem");
  return (data ?? []) as Journey[];
}

export async function listJourneyStages(journeyId?: string): Promise<JourneyStage[]> {
  const supabase = createClient();
  if (!supabase) return [];
  let q = supabase.from("hg_comm_journey_stages").select("*").order("ordem");
  if (journeyId) q = q.eq("journey_id", journeyId);
  const { data } = await q;
  return (data ?? []) as JourneyStage[];
}

// ============================================================
// Prompts (estúdio)
// ============================================================
export interface Prompt {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  modulo: string | null;
  tipo_mensagem: string | null;
  publico: string | null;
  momento: string | null;
  status: string;
  versao_publicada_id: string | null;
  atualizado_em: string;
}
export interface PromptVersion {
  id: string;
  prompt_id: string;
  versao: number;
  identidade: string | null;
  objetivo: string | null;
  contexto_permitido: unknown;
  contexto_proibido: unknown;
  regras: string | null;
  formato: string | null;
  tom: string | null;
  call_to_action: string | null;
  tamanho_min: number | null;
  tamanho_max: number | null;
  variaveis_permitidas: unknown;
  status: string;
  publicado_em: string | null;
  criado_em: string;
}

export async function listPrompts(): Promise<Prompt[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_ai_prompts").select("*").order("nome");
  return (data ?? []) as Prompt[];
}

export async function getPrompt(id: string): Promise<Prompt | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("hg_ai_prompts").select("*").eq("id", id).maybeSingle();
  return (data as Prompt) ?? null;
}

export async function listPromptVersions(promptId: string): Promise<PromptVersion[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_ai_prompt_versions")
    .select("*")
    .eq("prompt_id", promptId)
    .order("versao", { ascending: false });
  return (data ?? []) as PromptVersion[];
}

// ============================================================
// Áudios
// ============================================================
export interface AudioAsset {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  storage_path: string | null;
  duracao_seg: number | null;
  transcricao: string | null;
  transcricao_auto: boolean;
  quick_reply: boolean;
  gravado_por: string | null;
  status: string;
  versao: number;
  criado_em: string;
}

export async function listAudios(): Promise<AudioAsset[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_audio_assets")
    .select("*")
    .is("deleted_at", null)
    .order("criado_em", { ascending: false });
  return (data ?? []) as AudioAsset[];
}

export interface QuickReply {
  id: string;
  titulo: string;
  categoria: string | null;
  tipo: string;
  corpo: string | null;
  audio_id: string | null;
  ativa: boolean;
}
export async function listQuickReplies(): Promise<QuickReply[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_quick_replies").select("*").order("titulo");
  return (data ?? []) as QuickReply[];
}

// ============================================================
// Caixa de entrada / tarefas
// ============================================================
export interface Inbound {
  id: string;
  guest_id: string | null;
  telefone: string | null;
  canal: string;
  tipo: string;
  corpo: string | null;
  transcricao: string | null;
  transcricao_auto: boolean;
  classificacao_sugerida: string | null;
  classificacao: string | null;
  lida: boolean;
  atribuido_para: string | null;
  resolvido: boolean;
  criado_em: string;
}
export async function listInbound(): Promise<Inbound[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_comm_inbound")
    .select("*")
    .order("criado_em", { ascending: false });
  return (data ?? []) as Inbound[];
}

export interface CommTask {
  id: string;
  origem: string;
  guest_id: string | null;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  responsavel: string | null;
  status: string;
  prioridade: string;
  prazo: string | null;
  criado_em: string;
}
export async function listCommTasks(): Promise<CommTask[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_comm_tasks")
    .select("*")
    .order("criado_em", { ascending: false });
  return (data ?? []) as CommTask[];
}

// ============================================================
// Campanhas
// ============================================================
export interface Campaign {
  id: string;
  nome: string;
  tipo: string;
  canal: string;
  status: string;
  aprovacao_tipo: string;
  agendado_para: string | null;
  criado_em: string;
}
export async function listCampaigns(): Promise<Campaign[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_comm_campaigns")
    .select("*")
    .is("deleted_at", null)
    .order("criado_em", { ascending: false });
  return (data ?? []) as Campaign[];
}

// ============================================================
// WhatsApp oficial
// ============================================================
export interface WhatsappChannel {
  id: string;
  nome: string;
  numero: string | null;
  ddd: string | null;
  display_name: string | null;
  responsavel: string | null;
  provedor: string | null;
  ambiente: string;
  status: string;
  horario_inicio: string;
  horario_fim: string;
  limite_diario: number;
  limite_por_pessoa: number;
  assinatura: string | null;
  ativo: boolean;
  ultima_validacao: string | null;
  ultimo_envio: string | null;
  ultimo_erro: string | null;
}
export async function getWhatsappChannel(): Promise<WhatsappChannel | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("hg_whatsapp_channels")
    .select("*")
    .order("criado_em")
    .limit(1)
    .maybeSingle();
  return (data as WhatsappChannel) ?? null;
}

// ============================================================
// Dashboard de comunicação (§25)
// ============================================================
export interface CommDashboard {
  campanhasAtivas: number;
  mensagensProgramadas: number;
  mensagensEnviadas: number;
  falhas: number;
  respostasPendentes: number;
  tarefasAbertas: number;
  tarefasUrgentes: number;
  audiosAguardandoAprovacao: number;
  promptsAguardandoAprovacao: number;
  whatsappPendente: boolean;
}

export async function getCommDashboard(): Promise<CommDashboard> {
  const supabase = createClient();
  if (!supabase) {
    return {
      campanhasAtivas: 0,
      mensagensProgramadas: 0,
      mensagensEnviadas: 0,
      falhas: 0,
      respostasPendentes: 0,
      tarefasAbertas: 0,
      tarefasUrgentes: 0,
      audiosAguardandoAprovacao: 0,
      promptsAguardandoAprovacao: 0,
      whatsappPendente: true,
    };
  }
  const count = async (table: string, apply: (q: any) => any): Promise<number> => {
    const { count } = await apply(supabase.from(table).select("*", { count: "exact", head: true }));
    return count ?? 0;
  };

  const [
    campanhasAtivas,
    mensagensProgramadas,
    mensagensEnviadas,
    falhas,
    respostasPendentes,
    tarefasAbertas,
    tarefasUrgentes,
    audiosAguardandoAprovacao,
    canal,
  ] = await Promise.all([
    count("hg_comm_campaigns", (q) => q.in("status", ["aprovada", "agendada", "enviando"]).is("deleted_at", null)),
    count("hg_comm_messages", (q) => q.eq("status", "agendada")),
    count("hg_comm_deliveries", (q) => q.in("status", ["enviado", "entregue", "lido"])),
    count("hg_comm_deliveries", (q) => q.eq("status", "falha")),
    count("hg_comm_inbound", (q) => q.eq("resolvido", false)),
    count("hg_comm_tasks", (q) => q.in("status", ["aberta", "em_andamento"])),
    count("hg_comm_tasks", (q) => q.eq("prioridade", "urgente").in("status", ["aberta", "em_andamento"])),
    count("hg_audio_assets", (q) => q.eq("status", "em_revisao").is("deleted_at", null)),
    getWhatsappChannel(),
  ]);

  return {
    campanhasAtivas,
    mensagensProgramadas,
    mensagensEnviadas,
    falhas,
    respostasPendentes,
    tarefasAbertas,
    tarefasUrgentes,
    audiosAguardandoAprovacao,
    promptsAguardandoAprovacao: 0,
    whatsappPendente: !canal || canal.status !== "ativo",
  };
}
