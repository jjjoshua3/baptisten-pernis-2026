import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Sprout, TrendingUp, HandHelping, Share2 } from "lucide-react";
import { Shell, Paragraphs } from "@/components/shell";
import { getHome } from "@/lib/church/public";

export const Route = createFileRoute("/")({
  loader: () => getHome(),
  head: () => ({
    meta: [
      { title: "Baptistengemeente Pernis · Leven · Groeien · Dienen · Delen" },
      {
        name: "description",
        content:
          "Welkom bij Baptistengemeente Pernis. Elke zondag om 10:00 uur in Gemeentecentrum De Heuvel, Ring 322.",
      },
    ],
  }),
  component: Home,
});

const VALUES = [
  { icon: Heart, title: "Liefhebben", text: "Omdat God van ons houdt" },
  { icon: Sprout, title: "Leven", text: "In beweging en betrokken" },
  { icon: TrendingUp, title: "Groeien", text: "Als discipelen van Jezus" },
  { icon: HandHelping, title: "Dienen", text: "Met onze gaven en talenten" },
  { icon: Share2, title: "Delen", text: "In woord en daad" },
];

const PAGES = [
  { to: "/gemeente", title: "Gemeente", text: "Opgericht in 1947, met wortels vanaf 1932. Leden, bestuur en vrienden." },
  { to: "/voorganger", title: "Voorganger", text: "Aernout de Jong, parttime voorganger sinds 1 januari 2022." },
  { to: "/nieuw", title: "Nieuw hier?", text: "Hoe een zondagse dienst gaat: zingen, bidden, Bijbel, collecte en koffie." },
  { to: "/lid-worden", title: "Lid worden", text: "Lid via de doop, of vriend van de gemeente zonder stemrecht." },
  { to: "/bijdragen", title: "Bijdragen", text: "Tijd, talent of een gift. IBAN van de gemeente staat op de pagina." },
  { to: "/anbi", title: "ANBI", text: "Giften zijn onder voorwaarden aftrekbaar. Formulier als PDF." },
  { to: "/diaconie", title: "Diaconie", text: "Voedselpakketten in Pernis, Mercy Ships, en pastoraat." },
  { to: "/kinderen", title: "Kinderen", text: "Crèche, zondagsschool en bijbelklas tijdens de dienst." },
  { to: "/seizoenen", title: "Jaarthema", text: "Seizoenen van ons geloof, met twaalf woorden van Brian McLaren." },
] as const;

function Home() {
  const data = Route.useLoaderData();
  const s = data.settings;
  const words = (s.theme_words ?? "").split("\n").map((line) => line.split("|")).filter((p) => p[0]);

  return (
    <Shell>
      {data.announcements[0] ? (
        <div className="bg-navy px-5 py-3 text-center text-sm text-paper">
          <span className="font-semibold text-gold">{data.announcements[0].title}.</span>{" "}
          {data.announcements[0].body}
        </div>
      ) : null}
      <section className="bg-navy text-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-10 text-center sm:py-14">
          <img src="/logo-licht.png" alt="" width={64} height={64} className="mb-4 h-16 w-16 object-contain" />
          <p className="text-xs font-semibold tracking-[0.2em] text-gold">{s.service_line}</p>
          <h1 className="mt-3 flex flex-col gap-1 font-display text-4xl leading-none sm:text-6xl">
            <span>{s.hero_title}</span>
            <span className="text-gold">{s.hero_accent}</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-paper/85">{s.hero_subtitle}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/nieuw" className="rounded-full bg-paper px-7 py-3 font-semibold text-navy">
              Nieuw hier?
            </Link>
            <Link to="/agenda" className="rounded-full border border-paper/40 px-7 py-3 font-semibold">
              Bekijk de agenda
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <img
          src="/fotos/sfeer-3.jpg"
          alt="De kerkzaal in Gemeentecentrum De Heuvel"
          className="max-h-[28rem] w-full object-cover object-center"
        />
        <div className="mx-auto grid max-w-6xl gap-3 px-5 py-4 sm:grid-cols-3">
          <img src="/fotos/kaarsen.jpg" alt="Kaarsen bij het glas-in-lood" className="h-36 w-full rounded-2xl object-cover" />
          <img src="/fotos/sfeer-2.jpg" alt="Muziek tijdens de samenkomst" className="h-36 w-full rounded-2xl object-cover" />
          <img src="/fotos/sfeer-4.jpg" alt="Bord van Baptistengemeente Pernis, De Heuvel" className="h-36 w-full rounded-2xl object-cover" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-sm font-semibold text-gold-deep">Alles van de gemeente</p>
        <h2 className="mt-2 font-display text-4xl text-navy">Pagina’s</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAGES.map((item) => (
            <Link key={item.to} to={item.to} className="rounded-3xl border border-line bg-paper p-6 hover:border-gold">
              <h3 className="font-display text-2xl text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-sm font-semibold text-gold-deep">{s.about_kicker}</p>
          <h2 className="mt-3 font-display text-4xl text-navy">{s.about_title}</h2>
          <div className="mt-6 text-lg">
            <Paragraphs text={s.about_body ?? ""} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/gemeente" className="rounded-full bg-navy px-6 py-3 font-semibold text-paper">
              Meer over de gemeente
            </Link>
            <a
              href={s.youtube}
              className="rounded-full border border-navy px-6 py-3 font-semibold text-navy"
            >
              Diensten op YouTube
            </a>
          </div>
        </div>
        <aside className="rounded-3xl bg-navy p-8 text-paper lg:col-span-5">
          <p className="text-sm font-semibold text-gold">Zondag 10:00</p>
          <h3 className="mt-2 font-display text-3xl">Je bent welkom</h3>
          <p className="mt-4 leading-relaxed text-paper/85">
            We zingen, bidden, luisteren naar de Bijbel en hebben tijd voor ontmoeting. Kom binnen zoals je bent.
          </p>
          <Link to="/nieuw" className="mt-6 inline-block font-semibold text-gold">
            Wat kun je verwachten?
          </Link>
        </aside>
      </section>

      <section className="bg-paper py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center font-display text-4xl text-navy">Missie en visie</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl bg-cream p-8">
              <h3 className="font-display text-2xl text-navy">Onze missie</h3>
              <p className="mt-3 leading-relaxed">{s.mission}</p>
            </article>
            <article className="rounded-3xl bg-cream p-8">
              <h3 className="font-display text-2xl text-navy">Onze visie</h3>
              <p className="mt-3 leading-relaxed">{s.vision}</p>
            </article>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
            {VALUES.map((item) => (
              <article key={item.title} className="rounded-3xl border border-line bg-paper p-5">
                <item.icon className="text-gold" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-navy">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-center text-sm font-semibold text-gold-deep">{s.theme_kicker}</p>
        <h2 className="mt-2 text-center font-display text-4xl text-navy">{s.theme_title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted">{s.theme_intro}</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {words.map(([word, hint]) => (
            <div key={word} className="rounded-3xl border border-line bg-paper px-3 py-5 text-center">
              <p className="font-display text-xl text-navy">{word}</p>
              {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link to="/seizoenen" className="font-semibold text-gold-deep">
            Lees meer over het jaarthema
          </Link>
        </p>
      </section>

      <section className="bg-paper py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-4xl text-navy">Activiteiten</h2>
            <Link to="/activiteiten" className="font-semibold text-gold-deep">
              Alles
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {data.activities.map((item) => (
              <article key={item.id} className="rounded-3xl bg-cream p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">{item.audience}</p>
                <h3 className="mt-2 font-display text-2xl text-navy">{item.title}</h3>
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed">{item.body}</p>
                <p className="mt-4 text-sm font-medium text-navy">{item.whenLabel}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {data.upcoming.length > 0 ? (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-4xl text-navy">Binnenkort</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {data.upcoming.map((item) => (
              <article key={item.id} className="rounded-3xl border border-line bg-paper p-6">
                <p className="text-xs font-semibold text-gold-deep">{item.dateLabel}</p>
                <h3 className="mt-2 font-display text-2xl text-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.details}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </Shell>
  );
}
