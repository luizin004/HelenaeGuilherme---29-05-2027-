import { createClient } from "@/lib/supabase/server";
import { VENUES_FALLBACK, WEDDING } from "@/lib/constants";
import type { GalleryPhoto, Gift, StoryEvent, Venue, WeddingSettings } from "@/lib/database.types";

const STORY_FALLBACK: StoryEvent[] = [
  { id: "1", ano: "2017", titulo: "O encontro que mudou tudo", descricao: null, ordem: 1 },
  { id: "2", ano: "24 anos", titulo: "Nosso primeiro sonho construído juntos", descricao: null, ordem: 2 },
  { id: "3", ano: "27 anos", titulo: "Um passo ainda maior: a OralAligner", descricao: null, ordem: 3 },
  { id: "4", ano: "30 anos", titulo: "Uma vida de conquistas compartilhadas", descricao: null, ordem: 4 },
  { id: "5", ano: "2027", titulo: "Dez anos de história e o início do nosso maior projeto", descricao: null, ordem: 5 },
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
