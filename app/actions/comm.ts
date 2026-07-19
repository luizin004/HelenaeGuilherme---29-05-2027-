"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

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
