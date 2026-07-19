"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface DocState {
  ok: boolean;
  message: string;
}

/** Registra os metadados de um documento já enviado ao Storage privado. */
export async function registrarDocumento(_prev: DocState, formData: FormData): Promise<DocState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();

  if (!titulo || !path) return { ok: false, message: "Título e arquivo são obrigatórios." };

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase.from("hg_documents").insert({
    titulo,
    categoria: categoria || null,
    arquivo_url: path, // caminho no bucket privado (não é URL pública)
  });

  if (error) return { ok: false, message: "Não foi possível registrar o documento." };

  await logAudit(supabase, { modulo: "documentos", acao: "create", valorNovo: { titulo } });
  revalidatePath("/admin/documentos");
  return { ok: true, message: "Documento adicionado." };
}
