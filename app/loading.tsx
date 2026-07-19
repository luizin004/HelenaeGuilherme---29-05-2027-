export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-olive"
          role="status"
          aria-label="Carregando"
        />
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Carregando…</p>
      </div>
    </div>
  );
}
