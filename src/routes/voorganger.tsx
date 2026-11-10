import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { Paragraphs, Shell } from "@/components/shell";
import { getPastor } from "@/lib/church/public";

export const Route = createFileRoute("/voorganger")({
  loader: () => getPastor(),
  head: () => ({
    meta: [
      { title: "Voorganger · Baptistengemeente Pernis" },
      { name: "description", content: "Maak kennis met Aernout de Jong, parttime voorganger van Baptistengemeente Pernis." },
    ],
  }),
  component: Voorganger,
});

function Voorganger() {
  const pastor = Route.useLoaderData();
  const photo = pastor.photo && (pastor.photo.startsWith("data:image/") || pastor.photo.startsWith("/") || pastor.photo.startsWith("https://"));
  return (
    <Shell>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-12">
        <article className="lg:col-span-7">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-deep">Maak kennis met onze voorganger</p>
          <h1 className="mt-3 font-display text-5xl text-navy">{pastor.name}</h1>
          <p className="mt-3 text-lg text-muted">{pastor.roleLabel}. {pastor.sinceLabel}.</p>
          <div className="mt-6 text-lg">
            <Paragraphs text={pastor.bio} />
          </div>
          <div className="mt-8 flex flex-col gap-3 text-sm sm:flex-row">
            <Link className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 font-semibold text-paper" to="/contact">
              Stuur een bericht
            </Link>
            <a className="inline-flex items-center gap-2 rounded-full border border-navy px-5 py-3 font-semibold text-navy" href={`tel:${pastor.phone.replace(/-/g, "")}`}>
              <Phone className="size-4" aria-hidden="true" /> {pastor.phone}
            </a>
          </div>
        </article>
        <aside className="lg:col-span-5">
          {photo ? (
            <img src={pastor.photo} alt={pastor.name} className="w-full rounded-3xl object-cover" />
          ) : (
            <div className="overflow-hidden rounded-3xl bg-navy text-paper">
              <img src="/fotos/sfeer-3.webp" alt="Kerkzaal van De Heuvel" width={1024} height={577} loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <div className="p-6">
                <p className="text-sm font-semibold text-gold">{pastor.roleLabel}</p>
                <p className="mt-1 font-display text-3xl">{pastor.name}</p>
                <p className="mt-2 text-sm text-paper/75">
                  De foto van de voorganger op de oude site staat achter een afscherming en kon niet worden gekopieerd.
                  Een beheerder kan de echte foto uploaden; die verschijnt dan hier.
                </p>
              </div>
            </div>
          )}
        </aside>
      </section>
    </Shell>
  );
}
