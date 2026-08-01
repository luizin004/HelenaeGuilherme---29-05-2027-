/* eslint-disable @next/next/no-img-element */
import { Kpi, KpiGrid, Notice, PageTitle, Panel } from "@/components/admin/ui";
import { ComunicadoEvania } from "@/components/admin/festa/ComunicadoEvania";
import { ConfigFestaForm } from "@/components/admin/festa/ConfigFestaForm";
import {
  alternarDestaqueFoto,
  aprovarFotoFesta,
  aprovarTodasPendentes,
  excluirFotoFesta,
  recusarFotoFesta,
} from "@/app/actions/festa";
import { comunicadoNossaFesta, linkDaAba } from "@/domain/festa/album";
import { getFestaConfig, listFestaFotos } from "@/lib/festa-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  pendente: "bg-[#f6ecd6] text-warn",
  aprovada: "bg-[#e6efe0] text-success",
  recusada: "bg-[#f4e2dc] text-danger",
};

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

/**
 * Moderação do álbum colaborativo. Nada que o convidado envia aparece no site
 * antes de passar por aqui: aprovar é o que move o arquivo para a única pasta
 * do bucket com leitura pública.
 */
export default async function AdminNossaFestaPage({ searchParams }: { searchParams: { f?: string } }) {
  const filtro = searchParams.f ?? "pendente";
  const [fotos, config] = await Promise.all([listFestaFotos(), getFestaConfig()]);

  const conta = (s: string) => fotos.filter((f) => f.status === s).length;
  const visiveis = filtro === "todas" ? fotos : fotos.filter((f) => f.status === filtro);
  const autores = new Set(fotos.filter((f) => f.status === "aprovada").map((f) => f.autor.toLowerCase())).size;

  const link = linkDaAba(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

  const FILTROS = [
    { key: "pendente", label: `Aguardando (${conta("pendente")})` },
    { key: "aprovada", label: `Publicadas (${conta("aprovada")})` },
    { key: "recusada", label: `Recusadas (${conta("recusada")})` },
    { key: "todas", label: `Todas (${fotos.length})` },
  ];

  return (
    <>
      <PageTitle>Nossa Festa — fotos dos convidados</PageTitle>

      {!isSupabaseConfigured ? (
        <Notice>Conecte o Supabase e faça login para moderar as fotos.</Notice>
      ) : (
        <Notice>
          As fotos que os convidados enviam em <strong>/nossa-festa</strong> chegam aqui como{" "}
          <strong>aguardando</strong>. Só o que você aprovar aparece na galeria pública — com o crédito de quem tirou.
          O contato informado no envio fica visível apenas nesta tela.
        </Notice>
      )}

      <KpiGrid>
        <Kpi label="Aguardando" value={conta("pendente")} />
        <Kpi label="Publicadas" value={conta("aprovada")} />
        <Kpi label="Convidados fotógrafos" value={autores} />
        <Kpi label="Recebidas" value={fotos.length} />
      </KpiGrid>

      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        {FILTROS.map((f) => (
          <a
            key={f.key}
            href={`/admin/nossa-festa?f=${f.key}`}
            className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-wide transition ${
              filtro === f.key ? "bg-moss text-white" : "bg-white text-muted shadow-card hover:text-moss"
            }`}
          >
            {f.label}
          </a>
        ))}
        {conta("pendente") > 0 && (
          <form action={aprovarTodasPendentes} className="ml-auto">
            <button type="submit" className="btn btn-outline px-4 py-1.5 text-xs">
              Aprovar todas as {conta("pendente")} pendentes
            </button>
          </form>
        )}
      </div>

      {visiveis.length === 0 ? (
        <Panel title="Nada por aqui">
          <p className="p-6 text-sm text-muted">
            {fotos.length === 0
              ? "Assim que os convidados enviarem as fotos da festa, elas aparecem nesta tela para aprovação. 📷"
              : "Nenhuma foto neste filtro."}
          </p>
        </Panel>
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((f) => (
            <article key={f.id} className="overflow-hidden rounded-lg bg-white shadow-card">
              <div className="aspect-[4/3] bg-cream">
                {f.link ? (
                  <img src={f.link} alt={f.legenda ?? `Foto de ${f.autor}`} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">prévia indisponível</div>
                )}
              </div>

              <div className="grid gap-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-serif text-lg text-moss">
                    {f.autor}
                    {f.destaque && <span className="ml-1.5 text-gold">⭐</span>}
                  </p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_BADGE[f.status] ?? "bg-cream text-muted"}`}>
                    {f.status}
                  </span>
                </div>

                {f.legenda && <p className="text-sm leading-snug text-ink">{f.legenda}</p>}

                <p className="text-xs text-muted">
                  {quando(f.criado_em)}
                  {f.contato ? ` · contato: ${f.contato}` : ""}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {f.status !== "aprovada" && (
                    <form action={aprovarFotoFesta}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="path" value={f.arquivo_path} />
                      <button type="submit" className="text-xs text-success underline">aprovar</button>
                    </form>
                  )}
                  {f.status === "aprovada" && (
                    <>
                      <form action={alternarDestaqueFoto}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="destaque" value={(!f.destaque).toString()} />
                        <button type="submit" className="text-xs text-olive underline">
                          {f.destaque ? "tirar do destaque" : "destacar"}
                        </button>
                      </form>
                      <form action={recusarFotoFesta}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="path" value={f.arquivo_path} />
                        <button type="submit" className="text-xs text-warn underline">tirar do site</button>
                      </form>
                    </>
                  )}
                  {f.status === "pendente" && (
                    <form action={recusarFotoFesta}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="path" value={f.arquivo_path} />
                      <button type="submit" className="text-xs text-warn underline">recusar</button>
                    </form>
                  )}
                  <form action={excluirFotoFesta} className="ml-auto">
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="path" value={f.arquivo_path} />
                    <button type="submit" className="text-xs text-danger underline">excluir</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="grid gap-6">
        <Panel title="Comunicado da Evania">
          <ComunicadoEvania texto={comunicadoNossaFesta(link)} link={link} />
        </Panel>

        <Panel title="Configuração da aba">
          <ConfigFestaForm config={config} />
        </Panel>
      </div>
    </>
  );
}
