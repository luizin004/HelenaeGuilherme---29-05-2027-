import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="mb-2 text-sm uppercase tracking-[0.3em] text-olive">Página não encontrada</p>
      <h1 className="mb-3 font-serif text-5xl text-moss">404</h1>
      <p className="mb-8 max-w-md text-muted">
        Este caminho não existe. Que tal voltar ao início e acompanhar o nosso grande dia?
      </p>
      <Link href="/" className="btn btn-dark">
        Voltar ao início
      </Link>
    </div>
  );
}
