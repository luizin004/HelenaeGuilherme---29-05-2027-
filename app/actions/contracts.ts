"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseBRLToCents } from "@/domain/money";
import { logAudit } from "@/lib/audit";

export interface ContractFormState {
  ok: boolean;
  message: string;
}

/** Cadastra um contrato, opcionalmente ligado a um fornecedor. */
export async function criarContrato(
  _prev: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "");
  const valorRaw = String(formData.get("valor") ?? "").trim();
  const dataEvento = String(formData.get("data_evento") ?? "").trim();

  if (!titulo) return { ok: false, message: "Informe o título do contrato." };

  let valor = 0;
  if (valorRaw) {
    try {
      valor = parseBRLToCents(valorRaw) / 100; // hg_contracts.valor é numeric(12,2)
    } catch {
      return { ok: false, message: "Valor inválido." };
    }
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_contracts").insert({
    titulo,
    supplier_id: supplierId || null,
    valor,
    data_evento: dataEvento || null,
  });

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "contratos", acao: "create", valorNovo: { titulo, valor } });
  revalidatePath("/admin/contratos");
  return { ok: true, message: `Contrato "${titulo}" cadastrado.` };
}

const CONTRACT_STATUS = ["rascunho", "pendente_assinatura", "assinado", "concluido", "cancelado"];

/** Edita um contrato (título, fornecedor, valor, data, status). */
export async function atualizarContrato(
  _prev: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "");
  const valorRaw = String(formData.get("valor") ?? "").trim();
  const dataEvento = String(formData.get("data_evento") ?? "").trim();
  const status = String(formData.get("status") ?? "rascunho");

  if (!id) return { ok: false, message: "Contrato inválido." };
  if (!titulo) return { ok: false, message: "Informe o título." };
  if (!CONTRACT_STATUS.includes(status)) return { ok: false, message: "Status inválido." };

  let valor = 0;
  if (valorRaw) {
    try {
      valor = parseBRLToCents(valorRaw) / 100;
    } catch {
      return { ok: false, message: "Valor inválido." };
    }
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_contracts")
    .update({
      titulo,
      supplier_id: supplierId || null,
      valor,
      data_evento: dataEvento || null,
      status,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "contratos", acao: "update", registro: `hg_contracts:${id}`, valorNovo: { titulo, status } });
  revalidatePath("/admin/contratos");
  return { ok: true, message: `Contrato "${titulo}" atualizado.` };
}

const BUCKET = "hg-documentos";

/** Anexa (ou substitui) o arquivo do contrato já enviado ao Storage privado. */
export async function anexarArquivoContrato(id: string, path: string): Promise<ContractFormState> {
  if (!id || !path) return { ok: false, message: "Dados inválidos." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_contracts")
    .update({ arquivo_url: path })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: "Não foi possível anexar o arquivo." };

  await logAudit(supabase, { modulo: "contratos", acao: "update", registro: `hg_contracts:${id}`, valorNovo: { arquivo_url: path } });
  revalidatePath("/admin/contratos");
  return { ok: true, message: "Arquivo anexado ao contrato." };
}

/** Exclusão LÓGICA (soft-delete) de um contrato + remoção do arquivo anexado. */
export async function excluirContrato(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_contracts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (!error) {
    if (path) await supabase.storage.from(BUCKET).remove([path]);
    await logAudit(supabase, { modulo: "contratos", acao: "delete", registro: `hg_contracts:${id}` });
    revalidatePath("/admin/contratos");
  }
}
