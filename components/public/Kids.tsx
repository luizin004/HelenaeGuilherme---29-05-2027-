import { Reveal } from "./Reveal";

const FEATURES = [
  { icon: "🧸", titulo: "Monitoria", texto: "Equipe dedicada cuidando da diversão com segurança." },
  { icon: "🎨", titulo: "Atividades", texto: "Brincadeiras, recreação e cantinho de descanso." },
  { icon: "🍬", titulo: "Cardápio kids", texto: "Opções pensadas especialmente para as crianças." },
];

export function Kids() {
  return (
    <section id="infantil" className="bg-sand">
      <div className="mx-auto max-w-content px-6 py-24 text-center">
        <Reveal>
          <p className="eyebrow">Para os pequenos</p>
          <h2 className="section-title after:mx-auto after:mt-5 after:block after:h-px after:w-16 after:bg-gold after:content-['']">
            Espaço infantil
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-[1.08rem] text-muted">
            Para que os pais aproveitem cada momento com tranquilidade, preparamos um espaço
            especial e monitorado para as crianças.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.titulo} className="rounded bg-white p-8 shadow-card">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="my-2 font-serif text-xl text-moss">{f.titulo}</h3>
                <p className="text-sm text-muted">{f.texto}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
