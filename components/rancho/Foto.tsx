/**
 * Bloco de imagem com fallback gracioso: se o arquivo real existir, ele aparece
 * por cima; se não, o gradiente da paleta HG fica visível (multi-background CSS).
 * Server component — sem JS.
 */
export function Foto({ src, label, className = "" }: { src?: string; label: string; className?: string }) {
  const grad = "linear-gradient(135deg, #6f7352, #4b5540)";
  const bg = src ? `url('${src}') center / cover no-repeat, ${grad}` : grad;
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex items-center justify-center overflow-hidden rounded-lg text-center text-sm text-cream/80 ${className}`}
      style={{ background: bg }}
    >
      {!src && <span className="px-4">📷 {label}</span>}
    </div>
  );
}
