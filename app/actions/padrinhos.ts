"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface ActionState {
  ok: boolean;
  message: string;
}

const PAPEIS = ["padrinho", "madrinha"];
const LADOS = ["helena", "guilherme", "ambos"];

/** Cadastra um padrinho/madrinha. Nenhum dado é inventado — tudo vem do formulário. */
export async function criarPadrinho(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const papel = String(formData.get("papel") ?? "padrinho");
  const lado = String(formData.get("lado") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const relacao = String(formData.get("relacao") ?? "").trim();

  if (!nome) return { ok: false, message: "Informe o nome." };
  if (!PAPEIS.includes(papel)) return { ok: false, message: "Papel inválido." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_wedding_party").insert({
    nome,
    papel,
    lado: LADOS.includes(lado) ? lado : null,
    telefone: telefone || null,
    instagram: instagram || null,
    cidade: cidade || null,
    relacao: relacao || null,
  });
  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "padrinhos", acao: "create", valorNovo: { nome, papel } });
  revalidatePath("/admin/padrinhos");
  return { ok: true, message: `${papel === "madrinha" ? "Madrinha" : "Padrinho"} cadastrado(a).` };
}

/** Atualiza dados e status de acompanhamento (traje, ensaio, hospedagem, transporte). */
export async function atualizarPadrinho(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "Registro inválido." };

  const patch: Record<string, unknown> = {};
  const setIf = (campo: string, valores?: string[]) => {
    if (formData.has(campo)) {
      const v = String(formData.get(campo) ?? "").trim();
      if (!valores || valores.includes(v)) patch[campo] = v || null;
    }
  };
  setIf("telefone");
  setIf("instagram");
  setIf("cidade");
  setIf("relacao");
  setIf("observacao");
  setIf("status", ["convidado", "confirmado", "recusado", "pendente"]);
  setIf("traje_status", ["pendente", "medidas_solicitadas", "medidas_recebidas", "confirmado"]);
  setIf("ensaio_status", ["pendente", "convidado", "confirmado", "ausente"]);
  setIf("hospedagem_status", ["nao_precisa", "pendente", "resolvida"]);
  setIf("transporte_status", ["nao_precisa", "pendente", "resolvido"]);

  if (Object.keys(patch).length === 0) return { ok: false, message: "Nada para atualizar." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_wedding_party").update(patch).eq("id", id).is("deleted_at", null);
  if (error) return { ok: false, message: "Não foi possível salvar." };

  await logAudit(supabase, { modulo: "padrinhos", acao: "update", registro: `hg_wedding_party:${id}`, valorNovo: patch });
  revalidatePath("/admin/padrinhos");
  revalidatePath(`/admin/padrinhos/${id}`);
  revalidatePath("/admin/padrinhos/pendencias");
  return { ok: true, message: "Atualizado." };
}

/** Exclusão lógica (soft-delete). */
export async function excluirPadrinho(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("hg_wedding_party")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (!error) {
    await logAudit(supabase, { modulo: "padrinhos", acao: "delete", registro: `hg_wedding_party:${id}` });
    revalidatePath("/admin/padrinhos");
  }
}

/** Revalida as telas que dependem de padrinhos/casais/caixas. */
function revalidarPadrinhos() {
  for (const t of ["/admin/padrinhos", "/admin/padrinhos/duplas", "/admin/padrinhos/producao", "/admin"]) {
    revalidatePath(t);
  }
}

/**
 * Vincula DOIS padrinhos/madrinhas como casal/par (FASE 4).
 * Integridade: 2 pessoas distintas, ambas padrinhos ativos, nenhuma já em par
 * ativo. Marcar como par limpa a "caixa individual" das duas (o casal já é 1 caixa).
 */
export async function vincularPar(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const a = String(formData.get("member_a") ?? "").trim();
  const b = String(formData.get("member_b") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "casal").trim() || "casal";
  const nome = String(formData.get("nome") ?? "").trim();

  if (!a || !b) return { ok: false, message: "Selecione as duas pessoas do par." };
  if (a === b) return { ok: false, message: "Escolha duas pessoas diferentes." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { data: membros } = await supabase
    .from("hg_wedding_party")
    .select("id, nome, papel")
    .in("id", [a, b])
    .is("deleted_at", null);
  if (!membros || membros.length !== 2) return { ok: false, message: "Padrinho(s) não encontrado(s)." };
  if (!membros.every((m) => m.papel === "padrinho" || m.papel === "madrinha")) {
    return { ok: false, message: "Ambos precisam ser padrinho ou madrinha." };
  }

  // Ninguém pode estar em dois pares ativos.
  const { data: jaEmPar } = await supabase
    .from("hg_wedding_party_pairs")
    .select("id")
    .is("deleted_at", null)
    .or(`member_a.in.(${a},${b}),member_b.in.(${a},${b})`);
  if (jaEmPar && jaEmPar.length > 0) {
    return { ok: false, message: "Uma das pessoas já está em um casal. Desvincule antes." };
  }

  const rotulo = nome || membros.map((m) => m.nome).join(" e ");
  const { error } = await supabase.from("hg_wedding_party_pairs").insert({
    nome: rotulo,
    member_a: a,
    member_b: b,
    tipo,
    caixas: 1,
    convites_grandes: 1,
    convites_pequenos: 2,
    status_producao: "pendente",
    status_entrega: "pendente",
  });
  if (error) return { ok: false, message: "Não foi possível vincular. Verifique o login." };

  // O casal já é 1 caixa: limpa marcação de caixa individual das duas pessoas.
  await supabase.from("hg_wedding_party").update({ caixa_individual: false }).in("id", [a, b]);

  await logAudit(supabase, { modulo: "padrinhos", acao: "vincular_par", valorNovo: { a, b, tipo } });
  revalidarPadrinhos();
  return { ok: true, message: `Casal "${rotulo}" vinculado (1 caixa).` };
}

/** Desvincula um casal (soft-delete). As pessoas voltam para "A vincular" (FASE 14.13). */
export async function desvincularPar(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("hg_wedding_party_pairs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (!error) {
    await logAudit(supabase, { modulo: "padrinhos", acao: "desvincular_par", registro: `hg_wedding_party_pairs:${id}` });
    revalidarPadrinhos();
  }
}

/** Marca/desmarca um padrinho como "caixa individual" (FASE 5). */
export async function marcarCaixaIndividual(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const marcar = String(formData.get("marcar") ?? "true") === "true";
  if (!id) return;
  const supabase = createClient();
  if (!supabase) return;

  if (marcar) {
    // Não pode marcar caixa individual para quem está em um par ativo.
    const { data: emPar } = await supabase
      .from("hg_wedding_party_pairs")
      .select("id")
      .is("deleted_at", null)
      .or(`member_a.eq.${id},member_b.eq.${id}`);
    if (emPar && emPar.length > 0) return;
  }

  const { error } = await supabase
    .from("hg_wedding_party")
    .update({ caixa_individual: marcar })
    .eq("id", id)
    .is("deleted_at", null);
  if (!error) {
    await logAudit(supabase, { modulo: "padrinhos", acao: marcar ? "caixa_individual" : "remover_caixa_individual", registro: `hg_wedding_party:${id}` });
    revalidarPadrinhos();
  }
}

/** Cria uma tarefa para um padrinho. */
export async function criarTarefaPadrinho(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const memberId = String(formData.get("member_id") ?? "").trim();
  const prioridade = String(formData.get("prioridade") ?? "normal");
  const prazo = String(formData.get("prazo") ?? "").trim();
  if (!titulo) return { ok: false, message: "Descreva a tarefa." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };
  const { error } = await supabase.from("hg_wedding_party_tasks").insert({
    titulo,
    member_id: memberId || null,
    prioridade: ["baixa", "normal", "alta", "urgente"].includes(prioridade) ? prioridade : "normal",
    prazo: prazo || null,
  });
  if (error) return { ok: false, message: "Não foi possível criar a tarefa." };
  await logAudit(supabase, { modulo: "padrinhos", acao: "create", registro: "hg_wedding_party_tasks", valorNovo: { titulo } });
  revalidatePath("/admin/padrinhos/tarefas");
  return { ok: true, message: "Tarefa criada." };
}

/** Alterna o status de uma tarefa de padrinho. */
export async function atualizarStatusTarefaPadrinho(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !["aberta", "em_andamento", "concluida", "cancelada"].includes(status)) return;
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("hg_wedding_party_tasks").update({ status }).eq("id", id);
  revalidatePath("/admin/padrinhos/tarefas");
}
