import { createClient } from "@/lib/supabase/server";

export const BUCKET_FESTA = "hg-festa";

/** Uma foto enviada por convidado, como o painel enxerga. */
export interface FestaFoto {
  id: string;
  lote: string;
  autor: string;
  contato: string | null;
  legenda: string | null;
  arquivo_path: string;
  mime: string | null;
  tamanho_bytes: number | null;
  origem: string;
  status: "pendente" | "aprovada" | "recusada";
  destaque: boolean;
  criado_em: string;
}

export interface FestaConfig {
  aberto: boolean;
  whatsapp_numero: string | null;
  whatsapp_mensagem: string | null;
  chamada: string | null;
  agradecimento: string | null;
}

/** O que a página pública recebe — sem contato de ninguém. */
export interface FestaPublico extends FestaConfig {
  fotos: { id: string; autor: string; legenda: string | null; arquivo_path: string; criado_em: string; destaque: boolean }[];
}

const CONFIG_VAZIA: FestaConfig = {
  aberto: true,
  whatsapp_numero: null,
  whatsapp_mensagem: null,
  chamada: null,
  agradecimento: null,
};

/**
 * Assina os caminhos em UMA chamada só. Bucket privado: mesmo as fotos
 * aprovadas viajam por link temporário (1h), nunca por URL eterna.
 */
async function assinar(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  paths: string[],
): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  if (paths.length === 0) return mapa;
  const { data } = await supabase.storage.from(BUCKET_FESTA).createSignedUrls(paths, 3600);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) mapa.set(item.path, item.signedUrl);
  }
  return mapa;
}

/**
 * Dados da aba pública "Nossa Festa": configuração + galeria aprovada.
 * Passa por RPC porque o visitante é anônimo e não lê a tabela direto.
 */
export async function getFestaPublico(): Promise<FestaPublico & { links: Map<string, string> }> {
  const vazio = { ...CONFIG_VAZIA, fotos: [], links: new Map<string, string>() };
  const supabase = createClient();
  if (!supabase) return vazio;

  const { data } = await supabase.rpc("hg_festa_publico");
  if (!data || typeof data !== "object") return vazio;

  const p = data as FestaPublico;
  const fotos = Array.isArray(p.fotos) ? p.fotos : [];
  const links = await assinar(supabase, fotos.map((f) => f.arquivo_path));

  return { ...p, fotos, links };
}

/** Fotos para a tela de moderação, já com link assinado para pré-visualizar. */
export async function listFestaFotos(): Promise<(FestaFoto & { link: string | null })[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("hg_festa_fotos")
    .select("*")
    .is("deleted_at", null)
    .order("criado_em", { ascending: false });

  const fotos = (data ?? []) as FestaFoto[];
  const links = await assinar(supabase, fotos.map((f) => f.arquivo_path));
  return fotos.map((f) => ({ ...f, link: links.get(f.arquivo_path) ?? null }));
}

/** Configuração da aba (WhatsApp, textos, se está aberta a envios). */
export async function getFestaConfig(): Promise<FestaConfig> {
  const supabase = createClient();
  if (!supabase) return CONFIG_VAZIA;
  const { data } = await supabase
    .from("hg_festa_config")
    .select("aberto, whatsapp_numero, whatsapp_mensagem, chamada, agradecimento")
    .eq("id", 1)
    .maybeSingle();
  return (data as FestaConfig) ?? CONFIG_VAZIA;
}
