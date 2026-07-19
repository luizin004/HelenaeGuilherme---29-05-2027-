import { waLink, WA_MSG } from "@/lib/rancho";

/** Botão flutuante de WhatsApp, visível em toda a página do Rancho. */
export function WhatsAppButton() {
  return (
    <a
      href={waLink(WA_MSG.informacoes)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com o Rancho das Águas pelo WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
    >
      <span aria-hidden className="text-lg">💬</span>
      <span className="hidden sm:inline">Fale conosco</span>
    </a>
  );
}
