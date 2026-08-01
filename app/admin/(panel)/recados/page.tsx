import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { alternarDestaqueRecado, excluirRecado } from "@/app/actions/recados";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const BUCKET = "hg-recados";

interface RecadoRow {
  id: string;
  autor: string;
  tipo: "texto" | "audio" | "video";
  mensagem: string | null;
  arquivo_url: string | null;
  duracao_seg: number | null;
  destaque: boolean;
  criado_em: string;
}

const TIPO_LABEL: Record<string, string> = { texto: "Escrito", audio: "Áudio", video: "Vídeo" };

function quando(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function duracao(seg: number | null): string {
  if (!seg) return "";
  return `${String(Math.floor(seg / 60)).padStart(2, "0")}:${String(seg % 60).padStart(2, "0")}`;
}

/**
 * Recados que os convidados deixam ao confirmar presença — escritos, em áudio
 * e em vídeo. Os arquivos ficam num bucket privado; aqui viram links assinados
 * temporários (1h) só para quem tem acesso ao painel.
 */
export default async function RecadosPage({ searchParams }: { searchParams: { f?: string } }) {
  const supabase = createClient();
  const filtro = searchParams.f ?? "todos";

  let recados: (RecadoRow & { link: string | null })[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("hg_recados")
      .select("id, autor, tipo, mensagem, arquivo_url, duracao_seg, destaque, criado_em")
      .is("deleted_at", null)
      .order("criado_em", { ascending: false });

    recados = await Promise.all(
      ((data ?? []) as RecadoRow[]).map(async (r) => {
        if (!r.arquivo_url) return { ...r, link: null };
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(r.arquivo_url, 3600);
        return { ...r, link: signed?.signedUrl ?? null };
      }),
    );
  }

  const visiveis = recados.filter((r) =>
    filtro === "todos" ? true : filtro === "destaque" ? r.destaque : r.tipo === filtro,
  );

  const total = recados.length;
  const porTipo = (t: string) => recados.filter((r) => r.tipo === t).length;

  const FILTROS = [
    { key: "todos", label: `Todos (${total})` },
    { key: "texto", label: `Escritos (${porTipo("texto")})` },
    { key: "audio", label: `Áudios (${porTipo("audio")})` },
    { key: "video", label: `Vídeos (${porTipo("video")})` },
    { key: "destaque", label: `Favoritos (${recados.filter((r) => r.destaque).length})` },
  ];

  return (
    <>
      <PageTitle>Recados dos convidados</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para ver os recados.</Notice>
      ) : (
        <Notice>
          Tudo que os convidados deixam ao confirmar presença — escrito, em áudio ou em vídeo.
          Os arquivos ficam em armazenamento <strong>privado</strong>; os links aqui expiram em 1h.
          Marque com ⭐ os que vocês quiserem guardar (ou usar na festa).
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Recados" value={total} />
        <Kpi label="Áudios" value={porTipo("audio")} />
        <Kpi label="Vídeos" value={porTipo("video")} />
        <Kpi label="Favoritos" value={recados.filter((r) => r.destaque).length} />
      </KpiGrid>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <a
            key={f.key}
            href={`/admin/recados?f=${f.key}`}
            className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-wide transition ${
              filtro === f.key ? "bg-moss text-white" : "bg-white text-muted shadow-card hover:text-moss"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <Panel title="Sem recados por aqui">
          <p className="p-6 text-sm text-muted">
            Assim que os convidados começarem a confirmar presença, os recados aparecem nesta tela. 💌
          </p>
        </Panel>
      ) : (
        <div className="grid gap-4">
          {visiveis.map((r) => (
            <article key={r.id} className="rounded-lg bg-white p-6 shadow-card">
              <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-serif text-xl text-moss">
                    {r.autor}
                    {r.destaque && <span className="ml-2 text-gold">⭐</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {TIPO_LABEL[r.tipo]}
                    {r.duracao_seg ? ` · ${duracao(r.duracao_seg)}` : ""} · {quando(r.criado_em)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <form action={alternarDestaqueRecado}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="destaque" value={(!r.destaque).toString()} />
                    <button type="submit" className="text-xs text-olive underline">
                      {r.destaque ? "tirar dos favoritos" : "favoritar"}
                    </button>
                  </form>
                  <form action={excluirRecado}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="path" value={r.arquivo_url ?? ""} />
                    <button type="submit" className="text-xs text-danger underline">excluir</button>
                  </form>
                </div>
              </header>

              {r.tipo === "texto" && (
                <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-ink">
                  &ldquo;{r.mensagem}&rdquo;
                </p>
              )}

              {r.tipo === "audio" &&
                (r.link ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio controls src={r.link} className="w-full max-w-md" />
                ) : (
                  <p className="text-sm text-muted">Áudio indisponível.</p>
                ))}

              {r.tipo === "video" &&
                (r.link ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video controls src={r.link} className="w-full max-w-md rounded-lg" />
                ) : (
                  <p className="text-sm text-muted">Vídeo indisponível.</p>
                ))}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
