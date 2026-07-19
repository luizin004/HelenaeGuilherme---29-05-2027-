"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ContentState {
  ok: boolean;
  message: string;
}

/** Edita o conteúdo do site (CMS) — história e hashtag do casal. */
export async function salvarConteudo(_prev: ContentState, formData: FormData): Promise<ContentState> {
  const historia = String(formData.get("historia") ?? "").trim();
  const hashtag = String(formData.get("hashtag") ?? "").trim();

  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend não configurado." };

  const { error } = await supabase
    .from("hg_wedding_settings")
    .update({ historia: historia || null, hashtag: hashtag || null })
    .eq("id", 1);

  if (error) return { ok: false, message: "Não foi possível salvar. Verifique o login." };

  revalidatePath("/");
  revalidatePath("/admin/conteudo");
  return { ok: true, message: "Conteúdo salvo. O site já reflete as mudanças." };
}
