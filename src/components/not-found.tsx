import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-navy px-6 py-16 text-paper">
      <img src="/fotos/zaal.webp" alt="" width={1024} height={577} className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/50 via-navy/70 to-navy" />
      <div className="relative max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Baptistengemeente Pernis</p>
        <h1 className="mt-4 font-display text-6xl text-paper">404</h1>
        <p className="mt-3 font-display text-3xl">Deze pagina bestaat niet</p>
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
          Het adres klopt niet, of de pagina is verplaatst. Je kunt terug naar de gemeente.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy"
        >
          Naar de homepage
        </Link>
      </div>
    </main>
  );
}
