"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface ContingenciaState {
  ok: boolean;
  message: string;
}

const CAMPOS = ["previsao", "areas_cobertas", "cobertura_adicional", "drenagem", "acesso_veiculos", "protecao_equipamentos", "mudanca_palco", "responsavel", "horario_limite", "fornecedores", "comunicado"];

/** Salva o plano de chuva / contingência (painel interno). */
export async function salvarContingencia(_prev: ContingenciaState, formData: FormData): Promise<ContingenciaState> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const patch: Record<string, unknown> = { gerador: formData.get("gerador") === "on", status: String(formData.get("status") ?? "planejando"), atualizado_em: new Date().toISOString() };
  for (const c of CAMPOS) patch[c] = String(formData.get(c) ?? "").trim() || null;

  const { error } = await supabase.from("hg_contingencia").update(patch).eq("id", 1);
  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "operacao", acao: "update_contingencia", registro: "hg_contingencia:1" });
  revalidatePath("/admin/plano-chuva");
  return { ok: true, message: "Plano de chuva salvo." };
}
