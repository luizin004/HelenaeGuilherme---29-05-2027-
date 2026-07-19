import Link from "next/link";
import { Reveal } from "./Reveal";

export function Gifts() {
  return (
    <section id="presentes" className="mx-auto max-w-content px-6 py-24 text-center">
      <Reveal>
        <p className="eyebrow">Com carinho</p>
        <h2 className="section-title after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
          Lista de presentes
        </h2>
        <p className="mx-auto mb-10 max-w-lg text-[1.08rem] text-muted">
          A presença de vocês já é o maior presente. Para quem quiser nos ajudar a construir esse
          novo capítulo, deixamos algumas opções — com pagamento seguro via Pix ou cartão.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/presentes" className="btn btn-dark">
            Ver lista de presentes
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
