"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface SupplierFormState {
  ok: boolean;
  message: string;
}

/** Cadastra um fornecedor (painel, autenticado). */
export async function criarFornecedor(
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const contato = String(formData.get("contato_nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!nome) return { ok: false, message: "Informe o nome do fornecedor." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_suppliers").insert({
    nome,
    categoria: categoria || null,
    contato_nome: contato || null,
    telefone: telefone || null,
    email: email || null,
  });

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique se você está autenticado." };

  await logAudit(supabase, { modulo: "fornecedores", acao: "create", valorNovo: { nome, categoria } });
  revalidatePath("/admin/fornecedores");
  return { ok: true, message: `${nome} foi cadastrado.` };
}

const STATUS = ["prospeccao", "negociando", "contratado", "concluido", "cancelado"];

/** Edita um fornecedor (contato, status, observações). */
export async function atualizarFornecedor(
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const contato = String(formData.get("contato_nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const status = String(formData.get("status") ?? "prospeccao");
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  const documento = String(formData.get("documento") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();

  if (!id) return { ok: false, message: "Fornecedor inválido." };
  if (!nome) return { ok: false, message: "Informe o nome." };
  if (!STATUS.includes(status)) return { ok: false, message: "Status inválido." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_suppliers")
    .update({
      nome,
      categoria: categoria || null,
      contato_nome: contato || null,
      telefone: telefone || null,
      email: email || null,
      status,
      observacoes: observacoes || null,
      documento: documento || null,
      endereco: endereco || null,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "fornecedores", acao: "update", registro: `hg_suppliers:${id}`, valorNovo: { nome, status } });
  revalidatePath("/admin/fornecedores");
  revalidatePath("/admin/contratos");
  return { ok: true, message: `${nome} atualizado.` };
}

/** Exclusão LÓGICA (soft-delete) de um fornecedor. */
export async function excluirFornecedor(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_suppliers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (!error) {
    await logAudit(supabase, { modulo: "fornecedores", acao: "delete", registro: `hg_suppliers:${id}` });
    revalidatePath("/admin/fornecedores");
  }
}
