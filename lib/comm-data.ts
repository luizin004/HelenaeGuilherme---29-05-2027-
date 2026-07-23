import { createClient } from "@/lib/supabase/server";
import type { PessoaAudiencia } from "@/domain/comm/audience";

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
  caixa_individual: boolean;
  entrega_status: string;
}

export interface ParPadrinho {
  id: string;
  nome: string | null;
  tipo: string;
  member_a: string | null;
  member_b: string | null;
  nomeA: string | null;
  nomeB: string | null;
  caixas: number;
  convites_grandes: number;
  convites_pequenos: number;
  status_producao: string;
  status_entrega: string;
}

/** Pares/casais de padrinhos ativos, com os nomes dos integrantes resolvidos. */
export async function listParesPadrinhos(): Promise<ParPadrinho[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const [{ data: pares }, membros] = await Promise.all([
    supabase.from("hg_wedding_party_pairs").select("*").is("deleted_at", null).order("criado_em"),
    listPadrinhos(),
  ]);
  const nome = new Map(membros.map((m) => [m.id, m.nome]));
  return (pares ?? []).map((p) => ({
    id: p.id,
    nome: p.nome ?? null,
    tipo: p.tipo ?? "casal",
    member_a: p.member_a ?? null,
    member_b: p.member_b ?? null,
    nomeA: p.member_a ? nome.get(p.member_a) ?? null : null,
    nomeB: p.member_b ? nome.get(p.member_b) ?? null : null,
    caixas: Number(p.caixas ?? 1),
    convites_grandes: Number(p.convites_grandes ?? 1),
    convites_pequenos: Number(p.convites_pequenos ?? 0),
    status_producao: p.status_producao ?? "pendente",
    status_entrega: p.status_entrega ?? "pendente",
  }));
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

// ============================================================
// Audiência (convidados enriquecidos p/ campanhas)
// ============================================================
export async function listGuestsForAudience(): Promise<PessoaAudiencia[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const [{ data: guests }, { data: party }, { data: perfis }] = await Promise.all([
    supabase.from("hg_guests").select("id,nome,lado,status,telefone,eh_crianca").is("deleted_at", null),
    supabase.from("hg_wedding_party").select("guest_id").is("deleted_at", null),
    supabase.from("hg_guest_comm_profiles").select("guest_id,cidade_partida,opt_out"),
  ]);
  const padrinhoIds = new Set((party ?? []).map((p: { guest_id: string | null }) => p.guest_id).filter(Boolean));
  const perfilMap = new Map(
    (perfis ?? []).map((p: { guest_id: string; cidade_partida: string | null; opt_out: boolean }) => [p.guest_id, p]),
  );
  return (guests ?? []).map((g: Record<string, unknown>) => {
    const perfil = perfilMap.get(g.id as string);
    return {
      id: g.id as string,
      nome: g.nome as string,
      lado: (g.lado as string) ?? null,
      status: (g.status as string) ?? null,
      telefone: (g.telefone as string) ?? null,
      ehCrianca: Boolean(g.eh_crianca),
      ehPadrinho: padrinhoIds.has(g.id as string),
      cidadePartida: perfil?.cidade_partida ?? null,
      optOut: perfil?.opt_out ?? false,
    };
  });
}

// ============================================================
// Perfis de comunicação do convidado (§3)
// ============================================================
export interface GuestBasic {
  id: string;
  nome: string;
  lado: string | null;
  status: string;
  telefone: string | null;
}
export async function listGuestsBasic(): Promise<GuestBasic[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_guests")
    .select("id,nome,lado,status,telefone")
    .is("deleted_at", null)
    .order("nome");
  return (data ?? []) as GuestBasic[];
}

export interface GuestCommProfile {
  guest_id: string;
  nome_preferido: string | null;
  apelido_autorizado: string | null;
  lado: string | null; // vínculo principal (helena/guilherme/ambos/familia_*/...)
  parentesco: string | null; // tipo de vínculo (chave da lista controlada)
  tipo_vinculo_outro: string | null; // texto livre quando parentesco = "outro"
  relacao_helena: string | null;
  relacao_guilherme: string | null;
  relacao_ambos: string | null;
  proximidade: string | null;
  historia_autorizada: string | null;
  assuntos_permitidos: string | null;
  assuntos_proibidos: string | null;
  tom: string | null;
  formalidade: string | null;
  emocao: string | null;
  humor: string | null;
  tamanho: string | null;
  tratamento: string | null;
  canal_preferido: string | null;
  cidade_partida: string | null;
  precisa_hospedagem: boolean | null;
  aceita_whatsapp: boolean;
  aceita_email: boolean;
  aceita_audio: boolean;
  aceita_lembretes: boolean;
  opt_out: boolean;
  herdar_familia: boolean;
  observacao: string | null;
  pessoa_idosa: boolean;
  situacao_sensivel: boolean;
  forcar_aprovacao: boolean;
  perfil_bloqueado: boolean;
  humor_autorizado: boolean;
}
export async function getGuestCommProfile(guestId: string): Promise<GuestCommProfile | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("hg_guest_comm_profiles").select("*").eq("guest_id", guestId).maybeSingle();
  return (data as GuestCommProfile) ?? null;
}

export interface GuestVinculoContexto {
  guestId: string;
  nome: string;
  papel: string | null; // hg_guests.papel — fonte única (também usada pelos padrinhos/caixas)
  status: string | null; // RSVP
  ehCrianca: boolean;
  faixaEtaria: string | null;
  ehContatoPrincipal: boolean;
}

/**
 * Reúne, do convidado + grupo, os dados que o temperamento (domain/comm/temperament)
 * combina com o perfil de comunicação. Papel continua vindo de hg_guests — não
 * duplicamos essa informação no perfil (fonte única, já usada pelos padrinhos).
 */
export async function getGuestVinculoContexto(guestId: string): Promise<GuestVinculoContexto | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: g } = await supabase
    .from("hg_guests")
    .select("id,nome,papel,status,eh_crianca,faixa_etaria,group_id")
    .eq("id", guestId)
    .maybeSingle();
  if (!g) return null;

  let ehContatoPrincipal = false;
  if (g.group_id) {
    const { data: grupo } = await supabase
      .from("hg_guest_groups")
      .select("contato_principal_id")
      .eq("id", g.group_id)
      .maybeSingle();
    ehContatoPrincipal = grupo?.contato_principal_id === guestId;
  }

  return {
    guestId: g.id,
    nome: g.nome,
    papel: g.papel ?? null,
    status: g.status ?? null,
    ehCrianca: Boolean(g.eh_crianca),
    faixaEtaria: g.faixa_etaria ?? null,
    ehContatoPrincipal,
  };
}

// ============================================================
// Campanha (detalhe + audiência materializada)
// ============================================================
export interface CampaignFull extends Campaign {
  journey_id: string | null;
  journey_stage_id: string | null;
  publico_filtros: Record<string, unknown>;
  prompt_id: string | null;
  corpo_modelo: string | null;
}
export async function getCampaign(id: string): Promise<CampaignFull | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("hg_comm_campaigns").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  return (data as CampaignFull) ?? null;
}

export interface CampaignAudienceRow {
  id: string;
  guest_id: string | null;
  incluido: boolean;
  motivo_exclusao: string | null;
}
export async function listCampaignAudience(campaignId: string): Promise<CampaignAudienceRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_comm_campaign_audiences")
    .select("id,guest_id,incluido,motivo_exclusao")
    .eq("campaign_id", campaignId);
  return (data ?? []) as CampaignAudienceRow[];
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
