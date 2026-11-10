import { createFileRoute } from "@tanstack/react-router";
import { Shell, Paragraphs } from "@/components/shell";
import { getActivities } from "@/lib/church/public";

export const Route = createFileRoute("/activiteiten")({
  loader: () => getActivities(),
  head: () => ({
    meta: [
      { title: "Activiteiten · Baptistengemeente Pernis" },
      { name: "description", content: "Rock Solid, haken en breien, en de interkerkelijke gebedsavond." },
    ],
  }),
  component: Activiteiten,
});

function Activiteiten() {
  const items = Route.useLoaderData();
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="font-display text-5xl text-navy">Activiteiten</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Een gemeente die niets samen doet, is eigenlijk ook niets. Dit zijn de vaste activiteiten.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-3xl bg-paper p-7 shadow-sm ring-1 ring-line">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">{item.audience}</p>
              <h2 className="mt-2 font-display text-2xl text-navy">{item.title}</h2>
              <div className="mt-4 text-sm">
                <Paragraphs text={item.body} />
              </div>
              <p className="mt-5 text-sm font-semibold text-navy">{item.whenLabel}</p>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}
