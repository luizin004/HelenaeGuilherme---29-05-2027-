"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface CategoriaState {
  ok: boolean;
  message: string;
}

/**
 * Renomeia (ou mescla) uma categoria: atualiza todas as despesas que usam `de`
 * para `para`. Se `para` já existir, as despesas passam a compartilhá-la (merge).
 */
export async function renomearCategoria(_prev: CategoriaState, formData: FormData): Promise<CategoriaState> {
  const de = String(formData.get("de") ?? "").trim();
  const para = String(formData.get("para") ?? "").trim();
  if (!de) return { ok: false, message: "Categoria de origem inválida." };
  if (!para) return { ok: false, message: "Informe o novo nome." };
  if (de === para) return { ok: false, message: "O nome é o mesmo." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error, count } = await supabase
    .from("hg_expenses")
    .update({ categoria: para }, { count: "exact" })
    .eq("categoria", de)
    .is("deleted_at", null);
  if (error) return { ok: false, message: "Não foi possível renomear. Verifique o login." };

  await logAudit(supabase, { modulo: "financeiro", acao: "renomear_categoria", valorAnterior: { de }, valorNovo: { para, itens: count } });
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/relatorios");
  return { ok: true, message: `"${de}" → "${para}" em ${count ?? 0} item(ns).` };
}
