"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { filtrarAudiencia, type FiltrosAudiencia } from "@/domain/comm/audience";
import { listGuestsForAudience } from "@/lib/comm-data";
import { sincronizarPapelPadrinho } from "@/app/actions/guests";
import { PAPEIS } from "@/domain/convites/caixas";

const PAPEL_CASAMENTO_VALIDO = new Set(PAPEIS.map((p) => p.value as string));

export interface ActionState {
  ok: boolean;
  message: string;
}

/** Papel do usuário logado (para gates de aprovação/publicação). */
async function papelAtual(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("hg_profiles").select("papel").eq("id", user.id).maybeSingle();
  return (data?.papel as string) ?? null;
}

// ============================================================
// WhatsApp oficial — nunca guarda credenciais aqui (§18). Apenas metadados.
// O status "ativo" só deve valer após validação real do provedor.
// ============================================================
export async function salvarCanalWhatsapp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const patch: Record<string, unknown> = {
    nome: String(formData.get("nome") ?? "WhatsApp oficial").trim() || "WhatsApp oficial",
    numero: String(formData.get("numero") ?? "").trim() || null,
    ddd: String(formData.get("ddd") ?? "").trim() || null,
    display_name: String(formData.get("display_name") ?? "").trim() || null,
    responsavel: String(formData.get("responsavel") ?? "Evania").trim() || "Evania",
    provedor: String(formData.get("provedor") ?? "").trim() || null,
    assinatura: String(formData.get("assinatura") ?? "").trim() || null,
  };
  const amb = String(formData.get("ambiente") ?? "producao");
  if (["sandbox", "producao"].includes(amb)) patch.ambiente = amb;
  const hi = String(formData.get("horario_inicio") ?? "").trim();
  const hf = String(formData.get("horario_fim") ?? "").trim();
  if (hi) patch.horario_inicio = hi;
  if (hf) patch.horario_fim = hf;
  const ld = Number(formData.get("limite_diario"));
  const lp = Number(formData.get("limite_por_pessoa"));
  if (Number.isFinite(ld) && ld > 0) patch.limite_diario = Math.floor(ld);
  if (Number.isFinite(lp) && lp > 0) patch.limite_por_pessoa = Math.floor(lp);

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = id
    ? await supabase.from("hg_whatsapp_channels").update(patch).eq("id", id)
    : await supabase.from("hg_whatsapp_channels").insert(patch);
  if (error) return { ok: false, message: "Não foi possível salvar." };

  await logAudit(supabase, { modulo: "comunicacao", acao: "update", registro: "hg_whatsapp_channels", valorNovo: { numero: patch.numero } });
  revalidatePath("/admin/configuracoes/comunicacao/whatsapp");
  revalidatePath("/admin/comunicacao");
  return {
    ok: true,
    message:
      "Canal salvo. O envio só é liberado após a validação real pelo provedor — as credenciais ficam em variáveis de ambiente, nunca aqui.",
  };
}

// ============================================================
// Jornadas
// ============================================================
export async function alternarJornada(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const ativa = String(formData.get("ativa") ?? "") === "true";
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_comm_journeys").update({ ativa: !ativa }).eq("id", id);
  await logAudit(supabase, { modulo: "comunicacao", acao: "update", registro: `hg_comm_journeys:${id}`, valorNovo: { ativa: !ativa } });
  revalidatePath("/admin/comunicacao/jornadas");
}

export async function alternarFase(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const ativa = String(formData.get("ativa") ?? "") === "true";
  const journeyId = String(formData.get("journey_id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_comm_journey_stages").update({ ativa: !ativa }).eq("id", id);
  revalidatePath(`/admin/comunicacao/jornadas/${journeyId}`);
}

// ============================================================
// Estúdio de prompts — nova versão (rascunho) e publicação (versiona, não sobrescreve)
// ============================================================
export async function criarVersaoPrompt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const promptId = String(formData.get("prompt_id") ?? "").trim();
  if (!promptId) return { ok: false, message: "Prompt inválido." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { data: ultima } = await supabase
    .from("hg_ai_prompt_versions")
    .select("versao")
    .eq("prompt_id", promptId)
    .order("versao", { ascending: false })
    .limit(1)
    .maybeSingle();
  const versao = ((ultima?.versao as number) ?? 0) + 1;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("hg_ai_prompt_versions").insert({
    prompt_id: promptId,
    versao,
    identidade: String(formData.get("identidade") ?? "").trim() || null,
    objetivo: String(formData.get("objetivo") ?? "").trim() || null,
    regras: String(formData.get("regras") ?? "").trim() || null,
    formato: String(formData.get("formato") ?? "").trim() || null,
    tom: String(formData.get("tom") ?? "").trim() || null,
    call_to_action: String(formData.get("call_to_action") ?? "").trim() || null,
    status: "rascunho",
    criado_por: user?.id ?? null,
  });
  if (error) return { ok: false, message: "Não foi possível criar a versão." };

  await logAudit(supabase, { modulo: "comunicacao", acao: "create", registro: `hg_ai_prompt_versions:${promptId}`, valorNovo: { versao } });
  revalidatePath(`/admin/comunicacao/prompts/${promptId}`);
  return { ok: true, message: `Versão ${versao} criada como rascunho.` };
}

/** Publica uma versão (só noivos/admin). Não sobrescreve: aponta a versão publicada. */
export async function publicarVersaoPrompt(formData: FormData): Promise<void> {
  const versionId = String(formData.get("version_id") ?? "").trim();
  const promptId = String(formData.get("prompt_id") ?? "").trim();
  if (!versionId || !promptId) return;

  const supabase = createClient();
  if (!supabase) return;
  const papel = await papelAtual(supabase);
  if (!papel || !["admin", "noivos"].includes(papel)) return; // gate §29

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("hg_ai_prompt_versions")
    .update({ status: "publicado", publicado_em: new Date().toISOString(), aprovado_por: user?.id ?? null })
    .eq("id", versionId);
  await supabase.from("hg_ai_prompts").update({ status: "publicado", versao_publicada_id: versionId }).eq("id", promptId);

  await logAudit(supabase, { modulo: "comunicacao", acao: "approve", registro: `hg_ai_prompt_versions:${versionId}` });
  revalidatePath(`/admin/comunicacao/prompts/${promptId}`);
}

// ============================================================
// Caixa de entrada — classificar (humano confirma; nunca altera dado crítico) e resolver
// ============================================================
export async function classificarInbound(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const classificacao = String(formData.get("classificacao") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_comm_inbound").update({ classificacao: classificacao || null, lida: true }).eq("id", id);
  await logAudit(supabase, { modulo: "comunicacao", acao: "classify", registro: `hg_comm_inbound:${id}`, valorNovo: { classificacao } });
  revalidatePath("/admin/comunicacao/caixa-de-entrada");
}

export async function resolverInbound(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_comm_inbound").update({ resolvido: true, lida: true }).eq("id", id);
  revalidatePath("/admin/comunicacao/caixa-de-entrada");
}

/** Cria uma tarefa a partir de uma resposta recebida (§19.14). */
export async function criarTarefaDeInbound(formData: FormData): Promise<void> {
  const inboundId = String(formData.get("inbound_id") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim() || "Retornar contato";
  const supabase = createClient();
  if (!supabase) return;
  let guestId: string | null = null;
  if (inboundId) {
    const { data } = await supabase.from("hg_comm_inbound").select("guest_id").eq("id", inboundId).maybeSingle();
    guestId = (data?.guest_id as string) ?? null;
  }
  await supabase.from("hg_comm_tasks").insert({
    origem: "inbound",
    inbound_id: inboundId || null,
    guest_id: guestId,
    titulo,
    categoria: "atendimento",
  });
  revalidatePath("/admin/comunicacao/caixa-de-entrada");
  revalidatePath("/admin/comunicacao/evania");
}

export async function atualizarStatusTarefaComm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !["aberta", "em_andamento", "concluida", "cancelada"].includes(status)) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_comm_tasks").update({ status }).eq("id", id);
  revalidatePath("/admin/comunicacao/evania");
}

// ============================================================
// Áudios — registra metadados após upload no bucket privado (§14)
// ============================================================
export async function registrarAudio(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const storagePath = String(formData.get("storage_path") ?? "").trim();
  const duracao = Number(formData.get("duracao_seg"));
  const tamanho = Number(formData.get("tamanho_bytes"));
  const formato = String(formData.get("formato") ?? "").trim();
  const roteiro = String(formData.get("roteiro") ?? "").trim();
  const gravadoPor = String(formData.get("gravado_por") ?? "").trim();
  const quickReply = String(formData.get("quick_reply") ?? "") === "on";

  if (!titulo) return { ok: false, message: "Dê um título ao áudio." };
  if (!storagePath) return { ok: false, message: "Envie ou grave o áudio antes de salvar." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };
  const { error } = await supabase.from("hg_audio_assets").insert({
    titulo,
    categoria: categoria || null,
    storage_path: storagePath,
    formato: formato || null,
    duracao_seg: Number.isFinite(duracao) ? Math.round(duracao) : null,
    tamanho_bytes: Number.isFinite(tamanho) ? Math.round(tamanho) : null,
    roteiro: roteiro || null,
    gravado_por: gravadoPor || null,
    quick_reply: quickReply,
    status: "gravado",
  });
  if (error) return { ok: false, message: "Não foi possível registrar o áudio." };
  await logAudit(supabase, { modulo: "comunicacao", acao: "create", registro: "hg_audio_assets", valorNovo: { titulo } });
  revalidatePath("/admin/comunicacao/audios");
  return { ok: true, message: "Áudio registrado. Envie para revisão/aprovação antes de usar." };
}

export async function atualizarStatusAudio(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const validos = ["rascunho", "gravado", "em_revisao", "aprovado", "disponivel", "arquivado"];
  if (!id || !validos.includes(status)) return;
  const supabase = createClient();
  if (!supabase) return;
  // Aprovar exige noivos/admin (§29)
  if (status === "aprovado" || status === "disponivel") {
    const papel = await papelAtual(supabase);
    if (!papel || !["admin", "noivos"].includes(papel)) return;
  }
  await supabase.from("hg_audio_assets").update({ status }).eq("id", id);
  await logAudit(supabase, { modulo: "comunicacao", acao: "update", registro: `hg_audio_assets:${id}`, valorNovo: { status } });
  revalidatePath("/admin/comunicacao/audios");
}

export async function excluirAudio(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_audio_assets").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/comunicacao/audios");
}

// ============================================================
// Campanhas (§7) — criar, materializar audiência, aprovar, agendar, pausar
// ============================================================
function lerFiltros(formData: FormData): FiltrosAudiencia {
  const val = (k: string) => String(formData.get(k) ?? "");
  return {
    lado: (["helena", "guilherme", "ambos"].includes(val("lado")) ? val("lado") : "") as FiltrosAudiencia["lado"],
    status: (["confirmado", "pendente", "recusado"].includes(val("status")) ? val("status") : "") as FiltrosAudiencia["status"],
    telefone: (["com", "sem"].includes(val("telefone")) ? val("telefone") : "") as FiltrosAudiencia["telefone"],
    incluirCriancas: val("incluir_criancas") === "on",
    apenasPadrinhos: val("apenas_padrinhos") === "on",
    apenasOutraCidade: val("apenas_outra_cidade") === "on",
  };
}

export async function criarCampanha(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const canal = String(formData.get("canal") ?? "whatsapp");
  const aprovacao = String(formData.get("aprovacao_tipo") ?? "evania");
  const journeyId = String(formData.get("journey_id") ?? "").trim();
  const corpo = String(formData.get("corpo_modelo") ?? "").trim();
  if (!nome) return { ok: false, message: "Dê um nome à campanha." };

  const filtros = lerFiltros(formData);
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("hg_comm_campaigns")
    .insert({
      nome,
      canal: ["whatsapp", "email", "audio"].includes(canal) ? canal : "whatsapp",
      aprovacao_tipo: ["nenhuma", "evania", "um_noivo", "dois_noivos", "admin"].includes(aprovacao) ? aprovacao : "evania",
      journey_id: journeyId || null,
      publico_filtros: filtros as unknown as Record<string, unknown>,
      corpo_modelo: corpo || null,
      status: "rascunho",
      criado_por: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: "Não foi possível criar a campanha." };

  // Materializa a audiência já na criação.
  await materializarAudiencia(supabase, data.id as string, filtros);
  await logAudit(supabase, { modulo: "comunicacao", acao: "create", registro: `hg_comm_campaigns:${data.id}`, valorNovo: { nome } });
  revalidatePath("/admin/comunicacao/campanhas");
  return { ok: true, message: "Campanha criada. Confira a audiência e envie para aprovação." };
}

async function materializarAudiencia(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  campaignId: string,
  filtros: FiltrosAudiencia,
) {
  const pessoas = await listGuestsForAudience();
  const { incluidos, excluidos } = filtrarAudiencia(pessoas, filtros);
  await supabase.from("hg_comm_campaign_audiences").delete().eq("campaign_id", campaignId);
  const linhas = [
    ...incluidos.map((p) => ({ campaign_id: campaignId, guest_id: p.id, incluido: true, motivo_exclusao: null })),
    ...excluidos.map((e) => ({ campaign_id: campaignId, guest_id: e.pessoa.id, incluido: false, motivo_exclusao: e.motivo })),
  ];
  if (linhas.length) await supabase.from("hg_comm_campaign_audiences").insert(linhas);
}

/** Recalcula a audiência de uma campanha existente a partir dos filtros salvos. */
export async function recalcularAudiencia(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  const { data } = await supabase.from("hg_comm_campaigns").select("publico_filtros").eq("id", id).maybeSingle();
  const filtros = (data?.publico_filtros ?? {}) as FiltrosAudiencia;
  await materializarAudiencia(supabase, id, filtros);
  revalidatePath(`/admin/comunicacao/campanhas/${id}`);
}

export async function aprovarCampanha(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  const papel = await papelAtual(supabase);
  if (!papel || !["admin", "noivos"].includes(papel)) return; // aprovação humana (§20/§29)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("hg_comm_campaigns").update({ status: "aprovada", aprovado_por: user?.id ?? null }).eq("id", id);
  await logAudit(supabase, { modulo: "comunicacao", acao: "approve", registro: `hg_comm_campaigns:${id}` });
  revalidatePath(`/admin/comunicacao/campanhas/${id}`);
}

export async function agendarCampanha(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const quando = String(formData.get("agendado_para") ?? "").trim();
  if (!id || !quando) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_comm_campaigns").update({ status: "agendada", agendado_para: quando }).eq("id", id);
  await logAudit(supabase, { modulo: "comunicacao", acao: "update", registro: `hg_comm_campaigns:${id}`, valorNovo: { agendado_para: quando } });
  revalidatePath(`/admin/comunicacao/campanhas/${id}`);
}

export async function pausarCampanha(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_comm_campaigns").update({ status: "pausada" }).eq("id", id);
  revalidatePath(`/admin/comunicacao/campanhas/${id}`);
}

// ============================================================
// Perfil de comunicação do convidado (§3)
// ============================================================
export async function salvarPerfilComunicacao(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const guestId = String(formData.get("guest_id") ?? "").trim();
  if (!guestId) return { ok: false, message: "Convidado inválido." };
  const txt = (k: string) => (String(formData.get(k) ?? "").trim() || null);
  const bool = (k: string) => formData.get(k) === "on";

  const row = {
    guest_id: guestId,
    nome_preferido: txt("nome_preferido"),
    apelido_autorizado: txt("apelido_autorizado"),
    lado: txt("lado"), // vínculo principal
    parentesco: txt("parentesco"), // tipo de vínculo (chave controlada)
    tipo_vinculo_outro: txt("tipo_vinculo_outro"),
    relacao_helena: txt("relacao_helena"),
    relacao_guilherme: txt("relacao_guilherme"),
    relacao_ambos: txt("relacao_ambos"),
    proximidade: txt("proximidade"),
    historia_autorizada: txt("historia_autorizada"),
    assuntos_permitidos: txt("assuntos_permitidos"),
    assuntos_proibidos: txt("assuntos_proibidos"),
    tom: txt("tom"),
    formalidade: txt("formalidade"),
    emocao: txt("emocao"),
    humor: txt("humor"),
    tamanho: txt("tamanho"),
    tratamento: txt("tratamento"),
    canal_preferido: txt("canal_preferido"),
    cidade_partida: txt("cidade_partida"),
    precisa_hospedagem: bool("precisa_hospedagem"),
    aceita_whatsapp: bool("aceita_whatsapp"),
    aceita_email: bool("aceita_email"),
    aceita_audio: bool("aceita_audio"),
    aceita_lembretes: bool("aceita_lembretes"),
    opt_out: bool("opt_out"),
    herdar_familia: bool("herdar_familia"),
    observacao: txt("observacao"),
    pessoa_idosa: bool("pessoa_idosa"),
    situacao_sensivel: bool("situacao_sensivel"),
    forcar_aprovacao: bool("forcar_aprovacao"),
    perfil_bloqueado: bool("perfil_bloqueado"),
    humor_autorizado: bool("humor_autorizado"),
  };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_guest_comm_profiles").upsert(row, { onConflict: "guest_id" });
  if (error) return { ok: false, message: "Não foi possível salvar o perfil." };

  // Papel no casamento é editável aqui, mas a FONTE ÚNICA continua hg_guests.papel
  // (mesma usada pelos padrinhos/caixas) — nunca duplicamos essa lista.
  const papelCasamento = String(formData.get("papel_casamento") ?? "").trim();
  if (papelCasamento && PAPEL_CASAMENTO_VALIDO.has(papelCasamento)) {
    const { data: guest } = await supabase.from("hg_guests").select("nome, telefone").eq("id", guestId).maybeSingle();
    await supabase.from("hg_guests").update({ papel: papelCasamento }).eq("id", guestId);
    await sincronizarPapelPadrinho(supabase, {
      guestId,
      nome: row.nome_preferido || guest?.nome || "",
      papel: papelCasamento,
      telefone: guest?.telefone ?? null,
      lado: row.lado,
    });
  }

  await logAudit(supabase, { modulo: "comunicacao", acao: "update", registro: `hg_guest_comm_profiles:${guestId}` });
  revalidatePath(`/admin/comunicacao/perfis/${guestId}`);
  revalidatePath("/admin/comunicacao/perfis");
  revalidatePath("/admin/padrinhos");
  revalidatePath("/admin/convidados");
  return { ok: true, message: "Perfil de comunicação salvo." };
}

// ============================================================
// Estúdio de prompts — salvar teste (com contexto enviado/removido)
// ============================================================
export async function salvarTestePrompt(formData: FormData): Promise<void> {
  const versionId = String(formData.get("prompt_version_id") ?? "").trim();
  const promptId = String(formData.get("prompt_id") ?? "").trim();
  if (!versionId) return;
  const supabase = createClient();
  if (!supabase) return;
  const parseJson = (k: string) => {
    try {
      return JSON.parse(String(formData.get(k) ?? "null"));
    } catch {
      return null;
    }
  };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("hg_ai_prompt_tests").insert({
    prompt_version_id: versionId,
    entrada: parseJson("entrada"),
    contexto_enviado: parseJson("contexto_enviado"),
    contexto_removido: parseJson("contexto_removido"),
    saida: String(formData.get("saida") ?? "").trim() || null,
    avaliacao: parseJson("avaliacao"),
    criado_por: user?.id ?? null,
  });
  await logAudit(supabase, { modulo: "comunicacao", acao: "test", registro: `hg_ai_prompt_versions:${versionId}` });
  if (promptId) revalidatePath(`/admin/comunicacao/prompts/${promptId}/testar`);
}

// ============================================================
// Editar fase da jornada (§4/§5 editáveis)
// ============================================================
export async function atualizarFaseDetalhe(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const journeyId = String(formData.get("journey_id") ?? "").trim();
  if (!id) return { ok: false, message: "Fase inválida." };
  const num = Number(formData.get("intervalo_min_dias"));
  const patch = {
    nome: String(formData.get("nome") ?? "").trim() || "Fase",
    objetivo: String(formData.get("objetivo") ?? "").trim() || null,
    tipo_mensagem: String(formData.get("tipo_mensagem") ?? "").trim() || null,
    canal: ["whatsapp", "email", "audio"].includes(String(formData.get("canal"))) ? String(formData.get("canal")) : "whatsapp",
    aprovacao: String(formData.get("aprovacao") ?? "evania").trim() || "evania",
    intervalo_min_dias: Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0,
  };
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };
  const { error } = await supabase.from("hg_comm_journey_stages").update(patch).eq("id", id);
  if (error) return { ok: false, message: "Não foi possível salvar a fase." };
  await logAudit(supabase, { modulo: "comunicacao", acao: "update", registro: `hg_comm_journey_stages:${id}` });
  revalidatePath(`/admin/comunicacao/jornadas/${journeyId}`);
  return { ok: true, message: "Fase atualizada." };
}
