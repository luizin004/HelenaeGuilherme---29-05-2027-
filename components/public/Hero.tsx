import { Logo } from "./Logo";

export function Hero({
  noiva,
  noivo,
  dataLinha,
  conceito,
  local,
}: {
  noiva: string;
  noivo: string;
  dataLinha: string;
  conceito: string;
  local: string;
}) {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center justify-center overflow-hidden text-center text-white"
      style={{ background: "linear-gradient(135deg,#6f7352 0%,#4b5540 55%,#333b2b 100%)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 22% 28%,rgba(201,183,156,.22),transparent 42%),radial-gradient(circle at 80% 72%,rgba(255,255,255,.10),transparent 45%)",
        }}
      />
      <div className="relative z-10 animate-fadeUp px-6">
        <Logo className="mx-auto mb-7 h-24 w-auto opacity-95" white />
        <p className="mb-6 text-sm uppercase tracking-[0.42em] text-white/85">Vamos nos casar</p>
        <h1 className="font-serif text-6xl font-medium leading-none sm:text-7xl md:text-8xl">
          {noiva} <span className="italic text-gold">&amp;</span> {noivo}
        </h1>
        <p className="mx-auto mt-5 max-w-md font-serif text-xl italic text-gold-soft md:text-2xl">
          {conceito}
        </p>
        <p className="my-6 text-lg uppercase tracking-[0.35em] md:text-xl">{dataLinha}</p>
        <p className="mb-8 text-sm uppercase tracking-[0.2em] text-white/75">{local}</p>
        <a href="#rsvp" className="btn btn-light">
          Confirmar presença
        </a>
      </div>
      <a
        href="#historia"
        aria-label="Rolar para baixo"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-2xl text-white"
      >
        ↓
      </a>
    </section>
  );
}
