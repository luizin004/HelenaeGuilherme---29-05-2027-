/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Logo } from "@/components/public/Logo";
import { createClient } from "@/lib/supabase/server";
import { conviteUrl, qrDataUrl } from "@/lib/qr-image";
import { getSettings, getVenues, resolveCouple } from "@/lib/data";
import { WEDDING } from "@/lib/constants";
import { ImprimirConvite } from "@/components/public/ImprimirConvite";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Credencial {
  id: string;
  nome: string;
  status: string;
  eh_crianca: boolean;
  qr_token: string;
  mesa: string | null;
}

export default async function ConvitePage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  let credenciais: Credencial[] = [];

  if (supabase && UUID_RE.test(params.token)) {
    const { data } = await supabase.rpc("hg_rsvp_credenciais", { p_token: params.token });
    if (Array.isArray(data)) credenciais = data as Credencial[];
  }

  const [settings, venues] = await Promise.all([getSettings(), getVenues()]);
  const couple = resolveCouple(settings);
  const dataEvento = new Date(couple.dataISO).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WEDDING.timezone,
  });
  const cerimonia = venues.find((v) => v.tipo === "cerimonia") ?? null;
  const recepcao = venues.find((v) => v.tipo === "recepcao") ?? null;

  // QR de cada credencial — gerado no servidor, um por pessoa.
  const comQr = await Promise.all(
    credenciais.map(async (c) => ({ ...c, qr: await qrDataUrl(conviteUrl(c.qr_token)) })),
  );

  return (
    <main className="min-h-screen bg-ivory px-6 py-12 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 12mm; }`}</style>

      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link href={`/rsvp/${params.token}`} className="text-sm text-olive underline">
            ← voltar à confirmação
          </Link>
          <ImprimirConvite />
        </div>

        {comQr.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-soft">
            <Logo className="mx-auto mb-4 h-14 w-auto" />
            <p className="text-muted">
              Ainda não há presença confirmada neste convite. Volte à{" "}
              <Link href={`/rsvp/${params.token}`} className="text-olive underline">confirmação</Link>{" "}
              para marcar quem vai.
            </p>
          </div>
        ) : (
          <>
            <header className="mb-6 text-center">
              <Logo className="mx-auto h-16 w-auto" />
              <p className="mt-3 text-xs uppercase tracking-[0.3em] text-olive">Seu convite</p>
              <h1 className="font-serif text-3xl text-moss">
                {couple.noiva} &amp; {couple.noivo}
              </h1>
              <p className="mt-1 text-sm text-muted">{dataEvento} · {WEDDING.cidade}</p>
            </header>

            <p className="mb-6 rounded-lg bg-gold-soft px-5 py-4 text-center text-sm text-moss">
              Apresente o QR de cada pessoa na entrada. Pode salvar esta página, imprimir ou mostrar
              pelo celular — funciona dos dois jeitos. 🤍
            </p>

            <div className="grid gap-4">
              {comQr.map((c) => (
                <article
                  key={c.id}
                  className="flex break-inside-avoid items-center gap-5 rounded-xl bg-white p-5 shadow-soft print:border print:border-line print:shadow-none"
                >
                  <img src={c.qr} alt={`QR Code de ${c.nome}`} className="h-28 w-28 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-serif text-xl leading-tight text-moss">{c.nome}</p>
                    {c.eh_crianca && (
                      <span className="text-xs uppercase tracking-wide text-olive">criança</span>
                    )}
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-success">Presença confirmada</p>
                    {c.mesa && <p className="mt-1 text-sm text-muted">Mesa {c.mesa}</p>}
                  </div>
                </article>
              ))}
            </div>

            <section className="mt-8 grid gap-2 rounded-xl bg-white p-6 text-sm shadow-soft print:shadow-none">
              <p className="mb-1 font-serif text-lg text-moss">Onde e quando</p>
              {cerimonia && (
                <p className="text-muted">
                  <strong className="text-moss">Cerimônia:</strong> {cerimonia.nome}
                  {cerimonia.horario ? ` · ${cerimonia.horario}` : ""} — {cerimonia.endereco}
                </p>
              )}
              {recepcao && (
                <p className="text-muted">
                  <strong className="text-moss">Recepção:</strong> {recepcao.nome} — {recepcao.endereco}
                </p>
              )}
              <p className="text-muted">
                <strong className="text-moss">Traje:</strong> {WEDDING.traje}
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
