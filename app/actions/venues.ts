"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export interface VenueState {
  ok: boolean;
  message: string;
}

function parseCoord(raw: string): number | null {
  const v = raw.trim().replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Edita um local (endereço, cidade, horário, coordenadas, link do mapa). */
export async function salvarLocal(_prev: VenueState, formData: FormData): Promise<VenueState> {
  const id = String(formData.get("id") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const horario = String(formData.get("horario") ?? "").trim();
  const mapsUrl = String(formData.get("maps_url") ?? "").trim();
  if (!id) return { ok: false, message: "Local inválido." };

  const latitude = parseCoord(String(formData.get("latitude") ?? ""));
  const longitude = parseCoord(String(formData.get("longitude") ?? ""));

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_venues")
    .update({
      endereco: endereco || null,
      cidade: cidade || null,
      horario: horario || null,
      latitude,
      longitude,
      maps_url: mapsUrl || null,
    })
    .eq("id", id);
  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  await logAudit(supabase, { modulo: "cms", acao: "update_local", registro: `hg_venues:${id}` });
  revalidatePath("/admin/locais");
  revalidatePath("/");
  revalidatePath("/como-chegar");
  revalidatePath("/cerimonia");
  revalidatePath("/recepcao");
  return { ok: true, message: "Local atualizado. O site já reflete." };
}
