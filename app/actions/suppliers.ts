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
