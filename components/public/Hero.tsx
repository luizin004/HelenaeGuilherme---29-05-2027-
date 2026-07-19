import { Logo } from "./Logo";

export function Hero({ noiva, noivo, dataLinha }: { noiva: string; noivo: string; dataLinha: string }) {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center justify-center overflow-hidden text-center text-white"
      style={{ background: "linear-gradient(135deg,#9c876c 0%,#6f5a44 55%,#4a3a2c 100%)" }}
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
          {noiva} <span className="italic text-champagne">&amp;</span> {noivo}
        </h1>
        <p className="my-6 text-lg uppercase tracking-[0.35em] md:text-xl">{dataLinha}</p>
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
