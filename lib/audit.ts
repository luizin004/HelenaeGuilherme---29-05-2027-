import type { SupabaseClient } from "@supabase/supabase-js";

interface AuditEntry {
  modulo: string;
  acao: string; // create | update | delete | classify | confirm | checkin ...
  registro?: string; // ex.: "hg_guests:<id>"
  valorAnterior?: unknown;
  valorNovo?: unknown;
}

/**
 * Registra uma ação na trilha de auditoria (PROJECT_SPEC §10 / regra 21).
 * Nunca lança — auditoria não pode quebrar a operação principal.
 */
export async function logAudit(supabase: SupabaseClient, entry: AuditEntry): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("hg_audit_log").insert({
      usuario_id: user?.id ?? null,
      modulo: entry.modulo,
      acao: entry.acao,
      registro: entry.registro ?? null,
      valor_anterior: entry.valorAnterior ?? null,
      valor_novo: entry.valorNovo ?? null,
    });
  } catch {
    // silencioso por design
  }
}
