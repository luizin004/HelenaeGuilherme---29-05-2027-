"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

const BUCKET = "hg-recados";

/** Marca/desmarca um recado como favorito dos noivos. */
export async function alternarDestaqueRecado(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const destaque = String(formData.get("destaque") ?? "") === "true";
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase.from("hg_recados").update({ destaque }).eq("id", id);
  if (!error) revalidatePath("/admin/recados");
}

/** Exclusão LÓGICA do recado + remoção do arquivo, quando houver. */
export async function excluirRecado(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("hg_recados")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return;

  if (path) await supabase.storage.from(BUCKET).remove([path]);
  await logAudit(supabase, { modulo: "recados", acao: "delete", registro: `hg_recados:${id}` });
  revalidatePath("/admin/recados");
}
