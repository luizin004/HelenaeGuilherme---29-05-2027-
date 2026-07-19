"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface EvaniaState {
  ok: boolean;
  message: string;
}

const DIAS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const CANAIS = ["painel", "whatsapp", "email"];

/** Salva a configuração da Evania (grupo financeiro oficial + automações). */
export async function salvarEvania(_prev: EvaniaState, formData: FormData): Promise<EvaniaState> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const dias = DIAS.filter((d) => formData.get(`dia_${d}`) === "on").join(",");
  const canais = CANAIS.filter((c) => formData.get(`canal_${c}`) === "on").join(",");
  const horarioRaw = String(formData.get("horario") ?? "08:00").trim();
  const horario = /^\d{2}:\d{2}$/.test(horarioRaw) ? horarioRaw : "08:00";

  const patch = {
    ativa: formData.get("ativa") === "on",
    grupo_nome: String(formData.get("grupo_nome") ?? "").trim() || null,
    grupo_link: String(formData.get("grupo_link") ?? "").trim() || null,
    grupo_numero: String(formData.get("grupo_numero") ?? "").trim() || null,
    horario,
    dias: dias || "seg,ter,qua,qui,sex",
    canais: canais || "painel",
    responsaveis: String(formData.get("responsaveis") ?? "").trim() || null,
    lembrete_30d: formData.get("lembrete_30d") === "on",
    lembrete_15d: formData.get("lembrete_15d") === "on",
    lembrete_7d: formData.get("lembrete_7d") === "on",
    lembrete_3d: formData.get("lembrete_3d") === "on",
    lembrete_1d: formData.get("lembrete_1d") === "on",
    lembrete_dia: formData.get("lembrete_dia") === "on",
    lembrete_apos: formData.get("lembrete_apos") === "on",
    observacao: String(formData.get("observacao") ?? "").trim() || null,
    atualizado_em: new Date().toISOString(),
  };

  const { error } = await supabase.from("hg_evania_config").update(patch).eq("id", 1);
  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "evania", acao: "update", registro: "hg_evania_config:1", valorNovo: { ativa: patch.ativa } });
  revalidatePath("/admin/evania");
  return { ok: true, message: "Configuração da Evania salva." };
}
