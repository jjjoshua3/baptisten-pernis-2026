import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { eventIsPast, getEvents } from "@/lib/church/public";

export const Route = createFileRoute("/agenda")({
  loader: () => getEvents(),
  head: () => ({
    meta: [
      { title: "Agenda · Baptistengemeente Pernis" },
      { name: "description", content: "Vaste en komende activiteiten van Baptistengemeente Pernis." },
    ],
  }),
  component: Agenda,
});

function Agenda() {
  const events = Route.useLoaderData();
  const vast = events.filter((e) => e.kind === "vast");
  const komend = events.filter((e) => e.kind === "komend" && !eventIsPast(e.dateLabel));
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="font-display text-5xl text-navy">Agenda</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Veel activiteiten staan open voor iedereen. Sommige, zoals een gemeentevergadering, zijn alleen voor leden.
        </p>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl text-navy">Vaste activiteiten</h2>
            <ul className="mt-5 space-y-4">
              {vast.map((item) => (
                <li key={item.id} className="rounded-3xl bg-paper p-6 ring-1 ring-line">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">{item.dateLabel}</p>
                  <h3 className="mt-1 font-display text-2xl text-navy">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.details}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-3xl text-navy">Komende activiteiten</h2>
            <ul className="mt-5 space-y-4">
              {komend.length === 0 ? (
                <li className="rounded-3xl bg-paper p-6 text-muted ring-1 ring-line">
                  Er staan nu geen komende activiteiten op de agenda.
                </li>
              ) : (
                komend.map((item) => (
                  <li key={item.id} className="rounded-3xl border-l-4 border-gold bg-paper p-6 ring-1 ring-line">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">{item.dateLabel}</p>
                    <h3 className="mt-1 font-display text-2xl text-navy">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.details}</p>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-6 text-sm text-muted">
              Voor de allernieuwste info kun je <Link to="/contact" className="font-semibold text-navy">contact opnemen</Link>.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
