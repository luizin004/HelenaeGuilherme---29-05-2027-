import { createClient } from "@/lib/supabase/server";
import { VENUES_FALLBACK, WEDDING } from "@/lib/constants";
import type { GalleryPhoto, Gift, StoryEvent, Venue, WeddingSettings } from "@/lib/database.types";

const STORY_FALLBACK: StoryEvent[] = [
  { id: "1", ano: "2019", titulo: "O primeiro encontro", descricao: null, ordem: 1 },
  { id: "2", ano: "2022", titulo: "Fomos morar juntos", descricao: null, ordem: 2 },
  { id: "3", ano: "2025", titulo: "O pedido de casamento", descricao: null, ordem: 3 },
  { id: "4", ano: "2027", titulo: "O grande dia", descricao: null, ordem: 4 },
];

export async function getSettings(): Promise<WeddingSettings | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("hg_wedding_settings").select("*").eq("id", 1).single();
  return data ?? null;
}

export async function getVenues(): Promise<Venue[]> {
  const supabase = createClient();
  if (!supabase) return VENUES_FALLBACK;
  const { data } = await supabase.from("hg_venues").select("*").order("ordem");
  return data && data.length ? data : VENUES_FALLBACK;
}

export async function getStory(): Promise<StoryEvent[]> {
  const supabase = createClient();
  if (!supabase) return STORY_FALLBACK;
  const { data } = await supabase.from("hg_story_events").select("*").order("ordem");
  return data && data.length ? data : STORY_FALLBACK;
}

export async function getGallery(): Promise<GalleryPhoto[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("hg_gallery_photos").select("*").order("ordem");
  return data ?? [];
}

export async function getGifts(): Promise<Gift[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hg_gifts")
    .select("*")
    .is("deleted_at", null)
    .neq("status", "adquirido")
    .order("ordem");
  return data ?? [];
}

/** Nomes/data resolvidos (banco quando disponível, senão constantes). */
export function resolveCouple(settings: WeddingSettings | null) {
  return {
    noiva: settings?.noiva ?? WEDDING.noiva,
    noivo: settings?.noivo ?? WEDDING.noivo,
    dataISO: settings?.data_casamento ?? WEDDING.dataISO,
    historia: settings?.historia ?? null,
  };
}
