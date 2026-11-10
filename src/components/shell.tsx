import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

const GROUPS = [
  {
    label: "Kennismaken",
    items: [
      { to: "/nieuw", label: "Nieuw hier?" },
      { to: "/lid-worden", label: "Lid worden" },
      { to: "/agenda", label: "Agenda" },
    ],
  },
  {
    label: "Gemeente",
    items: [
      { to: "/gemeente", label: "Over de gemeente" },
      { to: "/voorganger", label: "Voorganger" },
      { to: "/diaconie", label: "Diaconie" },
      { to: "/kinderen", label: "Kinderen" },
      { to: "/seizoenen", label: "Jaarthema" },
    ],
  },
  {
    label: "Praktisch",
    items: [
      { to: "/activiteiten", label: "Activiteiten" },
      { to: "/bijdragen", label: "Bijdragen" },
      { to: "/anbi", label: "ANBI" },
      { to: "/contact", label: "Contact" },
    ],
  },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="" className="h-11 w-11 rounded-2xl bg-white object-contain p-1" />
              <span className="leading-tight">
                <span className="block text-base font-semibold tracking-tight text-navy">Baptistengemeente</span>
                <span className="block text-sm font-semibold text-gold">Pernis</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
              <Link to="/" className="text-ink hover:text-gold-deep">Home</Link>
              {GROUPS.map((group) => (
                <div key={group.label} className="group relative">
                  <button type="button" className="inline-flex items-center gap-1 text-ink hover:text-gold-deep">
                    {group.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <div className="invisible absolute left-0 top-full z-50 min-w-52 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="rounded-2xl border border-line bg-paper p-2 shadow-lg">
                      {group.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="block rounded-xl px-3 py-2 text-ink hover:bg-cream hover:text-gold-deep"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </nav>
            <div className="flex items-center gap-2">
            <Link
              to="/contact"
              className="hidden rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy hover:bg-gold-deep hover:text-paper sm:inline-flex"
            >
              Kom deze zondag
            </Link>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full text-navy lg:hidden"
              aria-label={open ? "Menu sluiten" : "Menu openen"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X /> : <Menu />}
            </button>
            </div>
        </div>
        {open ? (
          <nav className="flex flex-col gap-2 border-t border-line px-5 py-4 lg:hidden">
            <Link to="/" className="rounded-xl px-3 py-3 text-base font-medium hover:bg-cream" onClick={() => setOpen(false)}>
              Home
            </Link>
            {GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">{group.label}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block rounded-xl px-3 py-2.5 text-base font-medium hover:bg-cream"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <Link
              to="/contact"
              className="mt-2 rounded-full bg-gold px-4 py-3 text-center font-semibold text-navy"
              onClick={() => setOpen(false)}
            >
              Kom deze zondag
            </Link>
          </nav>
        ) : null}
      </header>
      <main>{children}</main>
      <footer className="bg-navy text-paper/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl text-paper">Baptistengemeente Pernis</p>
            <p className="mt-2 text-sm">Leven · Groeien · Dienen · Delen</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-paper">Adres</p>
            <p className="mt-2">Gemeentecentrum De Heuvel<br />Ring 322<br />3195 XS Pernis</p>
            <a className="mt-2 inline-block text-gold" href="mailto:info@baptistenpernis.nl">
              info@baptistenpernis.nl
            </a>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-paper">Ontdek</p>
            <ul className="mt-2 space-y-1">
              <li><Link to="/nieuw" className="hover:text-gold">Nieuw hier?</Link></li>
              <li><Link to="/diaconie" className="hover:text-gold">Diaconie</Link></li>
              <li><Link to="/seizoenen" className="hover:text-gold">Jaarthema</Link></li>
              <li><Link to="/lid-worden" className="hover:text-gold">Lid worden</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-paper">Praktisch</p>
            <ul className="mt-2 space-y-1">
              <li><Link to="/bijdragen" className="hover:text-gold">Bijdragen</Link></li>
              <li><Link to="/anbi" className="hover:text-gold">ANBI</Link></li>
              <li><Link to="/agenda" className="hover:text-gold">Agenda</Link></li>
              <li>
                <a className="hover:text-gold" href="https://www.youtube.com/@baptistengemeentepernis2194/streams">
                  Diensten op YouTube
                </a>
              </li>
            </ul>
            <p className="mt-4 text-xs">KvK 76461645 · ANBI</p>
          </div>
        </div>
        <p className="border-t border-paper/15 py-4 text-center text-xs">
          © 2026 Baptistengemeente Pernis
          {" · Ontworpen door "}
          <a className="text-gold underline" href="https://jjjoshua3.netlify.app/">Joshua</a>{". Beveiligingslek melden? Dat kan via: "}
          <a className="text-gold underline" href="mailto:aa0271n8@gmail.com">aa0271n8@gmail.com</a>
        </p>
      </footer>
    </div>
  );
}

export function Paragraphs({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      {text.split(/\n\n+/).filter(Boolean).map((part, index) => (
        <p key={index} className="whitespace-pre-wrap leading-relaxed">
          {linkify(part)}
        </p>
      ))}
    </div>
  );
}

function linkify(text: string) {
  const bits = text.split(/(https?:\/\/[^\s)]+)/g);
  return bits.map((bit, index) =>
    bit.startsWith("http") ? (
      <a key={index} href={bit} className="font-semibold text-navy underline decoration-gold underline-offset-2">
        {bit.includes("ANBI") ? "Download het ANBI-formulier (PDF)" : bit}
      </a>
    ) : (
      <span key={index}>{bit}</span>
    ),
  );
}
