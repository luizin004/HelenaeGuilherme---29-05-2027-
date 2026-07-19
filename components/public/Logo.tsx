/* eslint-disable @next/next/no-img-element */

/** Monograma HG. Use `white` para a versão clara sobre fundos escuros. */
export function Logo({ className = "", white = false }: { className?: string; white?: boolean }) {
  return (
    <img
      src="/logo.svg"
      alt="Helena e Guilherme"
      className={`${className} ${white ? "brightness-0 invert" : ""}`}
    />
  );
}
