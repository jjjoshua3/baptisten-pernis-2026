import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StaffLogin } from "@/components/staff-login";
import { logoutChurch } from "@/lib/church/login";
import {
  createStaffAccount,
  deleteActivity,
  deleteAnnouncement,
  deleteBlock,
  deleteEvent,
  deleteMessage,
  enterBeheer,
  grantPending,
  listAnnouncementsAdmin,
  listAudit,
  listMessages,
  listStaff,
  removeStaff,
  saveActivity,
  saveAnnouncement,
  saveBlock,
  saveEvent,
  savePage,
  savePastor,
  saveSettings,
  setMessageRead,
  updateStaff,
  sendJoshuaFeedback,
  type Staff,
} from "@/lib/church/admin";
import {
  getActivities,
  getEvents,
  getPage,
  getPastor,
  getSettings,
  type Activity,
  type ChurchEvent,
  type PageDoc,
  type Pastor,
} from "@/lib/church/public";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : "overzicht",
    magic: typeof search.magic === "string" ? search.magic : "",
  }),
  head: () => ({
    meta: [
      { title: "Beheer · Baptistengemeente Pernis" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BeheerGate,
});

const PAGE_SLUGS = ["gemeente", "kinderen", "lid-worden", "bijdragen", "anbi", "nieuw", "seizoenen", "diaconie"];

const FIELDS: { key: string; label: string; area?: boolean }[] = [
  { key: "service_line", label: "Dienstregel" },
  { key: "hero_title", label: "Kop, regel 1" },
  { key: "hero_accent", label: "Kop, gouden regel" },
  { key: "hero_subtitle", label: "Ondertitel" },
  { key: "about_kicker", label: "Over ons, label" },
  { key: "about_title", label: "Over ons, titel" },
  { key: "about_body", label: "Over ons, tekst", area: true },
  { key: "mission", label: "Missie", area: true },
  { key: "vision", label: "Visie", area: true },
  { key: "theme_kicker", label: "Jaarthema, label" },
  { key: "theme_title", label: "Jaarthema, titel" },
  { key: "theme_intro", label: "Jaarthema, intro", area: true },
  { key: "theme_words", label: "Woorden (woord|uitleg per regel)", area: true },
  { key: "address_name", label: "Naam" },
  { key: "address_building", label: "Gebouw" },
  { key: "address_street", label: "Straat" },
  { key: "address_postal", label: "Postcode en plaats" },
  { key: "email", label: "E-mail" },
  { key: "kvk", label: "KvK" },
  { key: "youtube", label: "YouTube" },
  { key: "iban", label: "IBAN" },
  { key: "iban_name", label: "Tenaamstelling" },
];

function BeheerGate() {
  const { magic } = Route.useSearch();
  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);

  useEffect(() => {
    void enterBeheer()
      .then((row) => setStaff(row))
      .catch(() => setStaff(null));
  }, []);

  if (staff === undefined && !magic) {
    return <div className="grid min-h-screen place-items-center bg-cream text-navy">Beheer laden…</div>;
  }
  if (!staff) return <StaffLogin title="Beheer" magic={magic} />;
  return <BeheerApp />;
}

function BeheerApp() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    void enterBeheer()
      .then((row) => setStaff(row))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Geen toegang");
        setStaff(null);
      });
  }, []);

  if (staff === undefined) {
    return <div className="grid min-h-screen place-items-center bg-cream text-navy">Rechten controleren…</div>;
  }
  if (!staff) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-5">
        <div className="max-w-md rounded-3xl bg-paper p-8 ring-1 ring-line">
          <h1 className="font-display text-3xl text-navy">Geen toegang</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Je bent ingelogd, maar een beheerder heeft je nog geen rechten gegeven. {error}
          </p>
          <div className="mt-6">
            <button type="button" className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-paper" onClick={() => {
              sessionStorage.removeItem("pernis_session");
              window.location.href = "/admin";
            }}>Opnieuw inloggen</button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overzicht", label: "Gegevens", show: true },
    { id: "agenda", label: "Agenda", show: staff.canAgenda },
    { id: "activiteiten", label: "Activiteiten", show: staff.canContent },
    { id: "paginas", label: "Pagina’s", show: staff.canContent },
    { id: "voorganger", label: "Voorganger", show: staff.canContent },
    { id: "aankondigingen", label: "Aankondigingen", show: staff.canContent },
    { id: "berichten", label: "Berichten", show: staff.canContent },
    { id: "gebruikers", label: "Gebruikers", show: staff.canUsers },
    { id: "audit", label: "Audit", show: staff.canAudit },
    { id: "feedback", label: "Feedback", show: true },
  ].filter((tab) => tab.show);
  const tab = tabs.some((item) => item.id === search.tab) ? search.tab : "overzicht";

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-navy text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Beheer</p>
            <p className="font-display text-2xl">{staff.displayName}</p>
            <p className="text-sm text-paper/70">{staff.role} · {staff.email}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-paper/40 px-4 py-2 text-sm font-semibold"
            onClick={() => {
              const token = sessionStorage.getItem("pernis_session") ?? "";
              sessionStorage.removeItem("pernis_session");
              void logoutChurch({ data: { token } }).finally(() => {
                window.location.href = "/admin";
              });
            }}
          >
            Uitloggen
          </button>
          <button
            type="button"
            className="rounded-full border border-gold px-4 py-2 text-sm font-semibold text-gold"
            onClick={() => {
              const link = `${window.location.origin}/admin`;
              void navigator.clipboard.writeText(link).then(() => setCopied("Inloglink gekopieerd."));
            }}
          >
            Kopieer inloglink
          </button>
          {copied ? <p className="w-full text-sm text-gold">{copied}</p> : null}
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 pb-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold " +
                (tab === item.id ? "bg-gold text-navy" : "bg-navy-deep text-paper")
              }
              onClick={() => void navigate({ search: { tab: item.id, magic: "" } })}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8">
        {tab === "overzicht" ? <SettingsPanel canEdit={staff.canContent} /> : null}
        {tab === "agenda" ? <AgendaPanel /> : null}
        {tab === "activiteiten" ? <ActivitiesPanel /> : null}
        {tab === "paginas" ? <PagesPanel /> : null}
        {tab === "voorganger" ? <PastorPanel /> : null}
        {tab === "aankondigingen" ? <AnnouncePanel /> : null}
        {tab === "berichten" ? <MessagesPanel /> : null}
        {tab === "gebruikers" ? <UsersPanel actor={staff} /> : null}
        {tab === "audit" ? <AuditPanel /> : null}
        {tab === "feedback" ? <FeedbackPanel staff={staff} /> : null}
      </div>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return text ? <p className="mt-3 text-sm text-navy">{text}</p> : null;
}

function SettingsPanel({ canEdit }: { canEdit: boolean }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  useEffect(() => {
    void getSettings().then(setValues).catch((e: unknown) => setNote(msg(e)));
  }, []);
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setNote("");
        void saveSettings({
          data: { entries: FIELDS.map((field) => ({ key: field.key, value: values[field.key] ?? "" })) },
        })
          .then(() => setNote("Opgeslagen."))
          .catch((e: unknown) => setNote(msg(e)));
      }}
    >
      <h2 className="font-display text-3xl text-navy">Kerkgegevens en homepage</h2>
      <p className="text-sm text-muted">Deze teksten staan op de homepage en bij contact. Alleen wie content mag beheren, kan ze wijzigen.</p>
      {FIELDS.map((field) => (
        <label key={field.key} className="block text-sm font-medium text-navy">
          {field.label}
          {field.area ? (
            <textarea
              disabled={!canEdit}
              rows={field.key.endsWith("body") || field.key === "theme_words" ? 6 : 3}
              className="mt-1 w-full rounded-2xl border border-line bg-paper px-4 py-3"
              value={values[field.key] ?? ""}
              onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
            />
          ) : (
            <input
              disabled={!canEdit}
              className="mt-1 w-full rounded-2xl border border-line bg-paper px-4 py-3"
              value={values[field.key] ?? ""}
              onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
            />
          )}
        </label>
      ))}
      {canEdit ? (
        <button type="submit" className="w-fit rounded-full bg-navy px-6 py-3 font-semibold text-paper">Opslaan</button>
      ) : null}
      <Note text={note} />
    </form>
  );
}

function AgendaPanel() {
  const [rows, setRows] = useState<ChurchEvent[]>([]);
  const [draft, setDraft] = useState({ id: 0, kind: "komend", dateLabel: "", title: "", details: "", sortOrder: 0 });
  const [note, setNote] = useState("");
  const load = () => void getEvents().then(setRows);
  useEffect(load, []);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-3xl text-navy">Agenda</h2>
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl bg-paper p-4 ring-1 ring-line">
              <p className="text-xs font-semibold uppercase text-gold-deep">{row.kind} · {row.dateLabel}</p>
              <p className="font-semibold text-navy">{row.title}</p>
              <div className="mt-2 flex gap-3 text-sm">
                <button type="button" className="font-semibold text-navy" onClick={() => setDraft(row)}>Wijzig</button>
                <button type="button" className="text-muted" onClick={() => void deleteEvent({ data: row.id }).then(load)}>Verwijder</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <form
        className="rounded-3xl bg-paper p-6 ring-1 ring-line"
        onSubmit={(event) => {
          event.preventDefault();
          void saveEvent({ data: draft })
            .then(() => {
              setDraft({ id: 0, kind: "komend", dateLabel: "", title: "", details: "", sortOrder: 0 });
              setNote("Opgeslagen.");
              load();
            })
            .catch((e: unknown) => setNote(msg(e)));
        }}
      >
        <h3 className="font-display text-2xl text-navy">{draft.id ? "Wijzigen" : "Nieuw item"}</h3>
        <select className="mt-4 w-full rounded-2xl border border-line px-4 py-3" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as "vast" | "komend" })}>
          <option value="vast">Vast</option>
          <option value="komend">Komend</option>
        </select>
        <input className="mt-3 w-full rounded-2xl border border-line px-4 py-3" placeholder="Datum of ritme" value={draft.dateLabel} onChange={(e) => setDraft({ ...draft, dateLabel: e.target.value })} />
        <input className="mt-3 w-full rounded-2xl border border-line px-4 py-3" placeholder="Titel" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <textarea className="mt-3 w-full rounded-2xl border border-line px-4 py-3" rows={4} placeholder="Details" value={draft.details} onChange={(e) => setDraft({ ...draft, details: e.target.value })} />
        <button type="submit" className="mt-4 rounded-full bg-gold px-5 py-3 font-semibold text-navy">Opslaan</button>
        <Note text={note} />
      </form>
    </div>
  );
}

function ActivitiesPanel() {
  const [rows, setRows] = useState<Activity[]>([]);
  const [draft, setDraft] = useState({ id: 0, title: "", audience: "", body: "", whenLabel: "", sortOrder: 0 });
  const [note, setNote] = useState("");
  const load = () => void getActivities().then(setRows);
  useEffect(load, []);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl bg-paper p-4 ring-1 ring-line">
            <p className="font-semibold text-navy">{row.title}</p>
            <p className="text-sm text-muted">{row.whenLabel}</p>
            <button type="button" className="mt-2 text-sm font-semibold" onClick={() => setDraft(row)}>Wijzig</button>
            <button type="button" className="ml-3 text-sm text-muted" onClick={() => void deleteActivity({ data: row.id }).then(load)}>Verwijder</button>
          </li>
        ))}
      </ul>
      <form
        className="rounded-3xl bg-paper p-6 ring-1 ring-line"
        onSubmit={(event) => {
          event.preventDefault();
          void saveActivity({ data: draft }).then(() => { setNote("Opgeslagen."); load(); }).catch((e: unknown) => setNote(msg(e)));
        }}
      >
        <h3 className="font-display text-2xl text-navy">Activiteit</h3>
        <input className="mt-3 w-full rounded-2xl border border-line px-4 py-3" placeholder="Titel" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input className="mt-3 w-full rounded-2xl border border-line px-4 py-3" placeholder="Doelgroep" value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })} />
        <input className="mt-3 w-full rounded-2xl border border-line px-4 py-3" placeholder="Wanneer" value={draft.whenLabel} onChange={(e) => setDraft({ ...draft, whenLabel: e.target.value })} />
        <textarea className="mt-3 w-full rounded-2xl border border-line px-4 py-3" rows={6} placeholder="Tekst" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        <button type="submit" className="mt-4 rounded-full bg-navy px-5 py-3 font-semibold text-paper">Opslaan</button>
        <Note text={note} />
      </form>
    </div>
  );
}

function PagesPanel() {
  const [slug, setSlug] = useState(PAGE_SLUGS[0]);
  const [page, setPage] = useState<PageDoc | null>(null);
  const [note, setNote] = useState("");
  const load = (next = slug) => void getPage({ data: next }).then(setPage).catch((e: unknown) => setNote(msg(e)));
  useEffect(() => { load(slug); }, [slug]);
  if (!page) return <p>Pagina laden…</p>;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PAGE_SLUGS.map((item) => (
          <button key={item} type="button" className={"rounded-full px-3 py-2 text-sm " + (item === slug ? "bg-navy text-paper" : "bg-paper ring-1 ring-line")} onClick={() => setSlug(item)}>
            {item}
          </button>
        ))}
      </div>
      <form
        className="mt-6 rounded-3xl bg-paper p-6 ring-1 ring-line"
        onSubmit={(event) => {
          event.preventDefault();
          void savePage({ data: page }).then(() => setNote("Paginakop opgeslagen.")).catch((e: unknown) => setNote(msg(e)));
        }}
      >
        <input className="w-full rounded-2xl border border-line px-4 py-3" value={page.kicker} onChange={(e) => setPage({ ...page, kicker: e.target.value })} />
        <input className="mt-3 w-full rounded-2xl border border-line px-4 py-3" value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} />
        <textarea className="mt-3 w-full rounded-2xl border border-line px-4 py-3" rows={2} value={page.lede} onChange={(e) => setPage({ ...page, lede: e.target.value })} />
        <button type="submit" className="mt-3 rounded-full bg-navy px-5 py-2 font-semibold text-paper">Kop opslaan</button>
      </form>
      <div className="mt-4 space-y-4">
        {page.blocks.map((block) => (
          <form
            key={block.id}
            className="rounded-3xl bg-paper p-6 ring-1 ring-line"
            onSubmit={(event) => {
              event.preventDefault();
              void saveBlock({ data: block }).then(() => { setNote("Blok opgeslagen."); load(); }).catch((e: unknown) => setNote(msg(e)));
            }}
          >
            <input className="w-full rounded-2xl border border-line px-4 py-3 font-semibold" value={block.heading} onChange={(e) => setPage({ ...page, blocks: page.blocks.map((b) => b.id === block.id ? { ...b, heading: e.target.value } : b) })} />
            <textarea className="mt-3 w-full rounded-2xl border border-line px-4 py-3" rows={6} value={block.body} onChange={(e) => setPage({ ...page, blocks: page.blocks.map((b) => b.id === block.id ? { ...b, body: e.target.value } : b) })} />
            <div className="mt-3 flex gap-3">
              <button type="submit" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy">Blok opslaan</button>
              <button type="button" className="text-sm text-muted" onClick={() => void deleteBlock({ data: block.id }).then(() => load())}>Verwijder</button>
            </div>
          </form>
        ))}
        <button
          type="button"
          className="rounded-full border border-navy px-4 py-2 text-sm font-semibold text-navy"
          onClick={() => void saveBlock({ data: { pageSlug: slug, heading: "Nieuwe kop", body: "Nieuwe tekst.", sortOrder: page.blocks.length + 1 } }).then(() => load())}
        >
          Tekstblok toevoegen
        </button>
      </div>
      <Note text={note} />
    </div>
  );
}

function PastorPanel() {
  const [pastor, setPastor] = useState<Pastor | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => { void getPastor().then(setPastor); }, []);
  if (!pastor) return <p>Laden…</p>;
  return (
    <form
      className="max-w-2xl space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void savePastor({ data: pastor }).then(() => setNote("Opgeslagen.")).catch((e: unknown) => setNote(msg(e)));
      }}
    >
      <h2 className="font-display text-3xl text-navy">Voorganger</h2>
      <p className="text-sm text-muted">
        Upload hier de echte foto (dezelfde als op de oude voorganger-pagina). Die server blokkeert automatisch kopiëren, daarom moet de foto één keer vanaf de computer.
      </p>
      {pastor.photo ? <img src={pastor.photo} alt="" className="max-h-64 rounded-2xl object-cover" /> : null}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="block text-sm"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > 900_000) {
            setNote("Kies een foto kleiner dan 900 KB.");
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : "";
            setPastor({ ...pastor, photo: result });
          };
          reader.readAsDataURL(file);
        }}
      />
      {(["name", "roleLabel", "sinceLabel", "email", "phone"] as const).map((key) => (
        <input key={key} className="w-full rounded-2xl border border-line bg-paper px-4 py-3" value={pastor[key]} onChange={(e) => setPastor({ ...pastor, [key]: e.target.value })} />
      ))}
      <textarea className="w-full rounded-2xl border border-line bg-paper px-4 py-3" rows={10} value={pastor.bio} onChange={(e) => setPastor({ ...pastor, bio: e.target.value })} />
      <button type="submit" className="rounded-full bg-navy px-5 py-3 font-semibold text-paper">Opslaan</button>
      <Note text={note} />
    </form>
  );
}

function AnnouncePanel() {
  const [rows, setRows] = useState<{ id: number; title: string; body: string; published: boolean | string }[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const load = () => void listAnnouncementsAdmin().then(setRows).catch((e: unknown) => setNote(msg(e)));
  useEffect(load, []);
  return (
    <div>
      <h2 className="font-display text-3xl text-navy">Aankondigingen</h2>
      <p className="mt-2 text-sm text-muted">Een gepubliceerde aankondiging verschijnt als balk op de homepage.</p>
      <form className="mt-4 rounded-3xl bg-paper p-6 ring-1 ring-line" onSubmit={(e) => { e.preventDefault(); void saveAnnouncement({ data: { title, body, published: true } }).then(() => { setTitle(""); setBody(""); load(); }); }}>
        <input className="w-full rounded-2xl border border-line px-4 py-3" placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="mt-3 w-full rounded-2xl border border-line px-4 py-3" rows={3} placeholder="Tekst" value={body} onChange={(e) => setBody(e.target.value)} />
        <button type="submit" className="mt-3 rounded-full bg-navy px-5 py-2 font-semibold text-paper">Publiceren</button>
      </form>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl bg-paper p-4 ring-1 ring-line">
            <p className="font-semibold">{row.title}</p>
            <p className="text-sm text-muted">{row.body}</p>
            <button type="button" className="mt-2 text-sm" onClick={() => void deleteAnnouncement({ data: row.id }).then(load)}>Verwijder</button>
          </li>
        ))}
      </ul>
      <Note text={note} />
    </div>
  );
}

function MessagesPanel() {
  const [rows, setRows] = useState<{ id: number; name: string; email: string; body: string; read: boolean | string; created_at: string }[]>([]);
  const load = () => void listMessages().then(setRows);
  useEffect(load, []);
  return (
    <div>
      <h2 className="font-display text-3xl text-navy">Berichten</h2>
      <ul className="mt-4 space-y-3">
        {rows.length === 0 ? <li className="text-muted">Nog geen berichten.</li> : null}
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl bg-paper p-4 ring-1 ring-line">
            <p className="font-semibold text-navy">{row.name} · {row.email}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{row.body}</p>
            <p className="mt-2 text-xs text-muted">{row.created_at}</p>
            <button type="button" className="mt-2 text-sm font-semibold" onClick={() => void setMessageRead({ data: { id: row.id, read: true } }).then(load)}>Gelezen</button>
            <button type="button" className="ml-3 text-sm text-muted" onClick={() => void deleteMessage({ data: row.id }).then(load)}>Verwijder</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UsersPanel({ actor }: { actor: Staff }) {
  const [data, setData] = useState<{ staff: Staff[]; pending: { id: string; name: string; email: string }[] }>({ staff: [], pending: [] });
  const [form, setForm] = useState({ name: "", email: "", role: "medewerker", canAgenda: true, canContent: false, canUsers: false, canAudit: false });
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const load = () => void listStaff().then(setData).catch((e: unknown) => setNote(msg(e)));
  useEffect(load, []);
  useEffect(() => {
    setLink(`${window.location.origin}/admin`);
  }, []);
  return (
    <div className="grid gap-6">
      <div className="rounded-3xl bg-navy p-6 text-paper">
        <h2 className="font-display text-3xl">Inloglink</h2>
        <p className="mt-2 max-w-2xl text-sm text-paper/80">
          Medewerkers vullen op /admin hun e-mailadres in. Ze krijgen dan een link die dertig minuten geldig is.
          Een beheerder zet hieronder per persoon de rechten op ja of nee.
        </p>
        <p className="mt-4 break-all font-semibold text-gold">{link}</p>
        <button
          type="button"
          className="mt-4 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-navy"
          onClick={() => void navigator.clipboard.writeText(link).then(() => setNote("Inloglink gekopieerd."))}
        >
          Kopieer inloglink
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-3xl text-navy">Gebruikers</h2>
        <p className="mt-2 text-sm text-muted">Eigenaar mag alles. Bij de anderen vink je per onderdeel ja of nee aan en sla je op.</p>
        <ul className="mt-4 space-y-3">
          {data.staff.map((person) => (
            <StaffEditor key={person.userId} person={person} actor={actor} onDone={load} onError={(text) => setNote(text)} />
          ))}
        </ul>
        {data.pending.length > 0 ? (
          <div className="mt-6">
            <h3 className="font-semibold text-navy">Ingelogd via Google of X, nog zonder rechten</h3>
            {data.pending.map((person) => (
              <PendingGrant key={person.id} person={person} actor={actor} onDone={load} onError={(text) => setNote(text)} />
            ))}
          </div>
        ) : null}
      </div>
      <form
        className="h-fit rounded-3xl bg-paper p-6 ring-1 ring-line"
        onSubmit={(event) => {
          event.preventDefault();
          void createStaffAccount({ data: form })
            .then(() => {
              setNote(`Account voor ${form.email} is aangemaakt. Die persoon kan nu een inloglink aanvragen.`);
              setForm({ ...form, name: "", email: "" });
              load();
            })
            .catch((e: unknown) => setNote(msg(e)));
        }}
      >
        <h3 className="font-display text-2xl text-navy">Account aanmaken</h3>
        <input className="mt-3 w-full rounded-2xl border border-line px-4 py-3" placeholder="Naam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="mt-3 w-full rounded-2xl border border-line px-4 py-3" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <RightsFields
          role={form.role}
          flags={form}
          allowOwner={actor.role === "eigenaar" || actor.role === "ontwikkelaar"}
          onRole={(role) => setForm({ ...form, role })}
          onFlag={(key, value) => setForm({ ...form, [key]: value })}
        />
        <button type="submit" className="mt-4 rounded-full bg-gold px-5 py-3 font-semibold text-navy">Account aanmaken</button>
        <Note text={note} />
      </form>
      </div>
    </div>
  );
}

function RightsFields({
  role,
  flags,
  allowOwner,
  onRole,
  onFlag,
}: {
  role: string;
  flags: { canAgenda: boolean; canContent: boolean; canUsers: boolean; canAudit: boolean };
  allowOwner: boolean;
  onRole: (role: string) => void;
  onFlag: (key: "canAgenda" | "canContent" | "canUsers" | "canAudit", value: boolean) => void;
}) {
  return (
    <>
      <select className="mt-3 w-full rounded-2xl border border-line px-4 py-3" value={role} onChange={(e) => onRole(e.target.value)}>
        <option value="medewerker">Medewerker</option>
        <option value="beheerder">Beheerder</option>
        {allowOwner ? <option value="ontwikkelaar">Ontwikkelaar</option> : null}
        {allowOwner ? <option value="eigenaar">Eigenaar</option> : null}
      </select>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {([
          ["canAgenda", "Agenda beheren"],
          ["canContent", "Teksten beheren"],
          ["canUsers", "Gebruikers beheren"],
          ["canAudit", "Audit bekijken"],
        ] as const).map(([key, label]) => {
          const locked = role === "eigenaar" || role === "ontwikkelaar";
          return (
          <label key={key} className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2">
            <input type="checkbox" checked={locked || flags[key]} disabled={locked} onChange={(e) => onFlag(key, e.target.checked)} />
            {label}: {locked || flags[key] ? "ja" : "nee"}
          </label>
          );
        })}
      </div>
    </>
  );
}

function StaffEditor({
  person,
  actor,
  onDone,
  onError,
}: {
  person: Staff;
  actor: Staff;
  onDone: () => void;
  onError: (text: string) => void;
}) {
  const [role, setRole] = useState(person.role);
  const [flags, setFlags] = useState({
    canAgenda: person.canAgenda,
    canContent: person.canContent,
    canUsers: person.canUsers,
    canAudit: person.canAudit,
  });
  return (
    <li className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      <p className="font-semibold text-navy">{person.displayName}</p>
      <p className="text-sm text-muted">{person.email}</p>
      <RightsFields
        role={role}
        flags={flags}
        allowOwner={actor.role === "eigenaar" || actor.role === "ontwikkelaar"}
        onRole={(next) => setRole(next === "eigenaar" || next === "beheerder" || next === "ontwikkelaar" ? next : "medewerker")}
        onFlag={(key, value) => setFlags({ ...flags, [key]: value })}
      />
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-paper"
          onClick={() =>
            void updateStaff({ data: { userId: person.userId, role, ...flags } })
              .then(onDone)
              .catch((e: unknown) => onError(msg(e)))
          }
        >
          Rechten opslaan
        </button>
        {person.role !== "eigenaar" || actor.role === "eigenaar" || actor.role === "ontwikkelaar" ? (
          <button type="button" className="text-sm text-muted" onClick={() => void removeStaff({ data: person.userId }).then(onDone).catch((e: unknown) => onError(msg(e)))}>
            Toegang intrekken
          </button>
        ) : null}
      </div>
    </li>
  );
}

function PendingGrant({
  person,
  actor,
  onDone,
  onError,
}: {
  person: { id: string; name: string; email: string };
  actor: Staff;
  onDone: () => void;
  onError: (text: string) => void;
}) {
  const [role, setRole] = useState("medewerker");
  const [flags, setFlags] = useState({ canAgenda: false, canContent: false, canUsers: false, canAudit: false });
  return (
    <div className="mt-2 rounded-2xl bg-paper p-4 ring-1 ring-line">
      <p className="text-sm font-semibold text-navy">{person.name}</p>
      <p className="text-sm text-muted">{person.email}</p>
      <RightsFields
        role={role}
        flags={flags}
        allowOwner={actor.role === "eigenaar" || actor.role === "ontwikkelaar"}
        onRole={(next) => setRole(next === "eigenaar" || next === "beheerder" || next === "ontwikkelaar" ? next : "medewerker")}
        onFlag={(key, value) => setFlags({ ...flags, [key]: value })}
      />
      <button
        type="button"
        className="mt-3 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy"
        onClick={() =>
          void grantPending({ data: { userId: person.id, role, ...flags } })
            .then(onDone)
            .catch((e: unknown) => onError(msg(e)))
        }
      >
        Rechten geven
      </button>
    </div>
  );
}

function AuditPanel() {
  const [rows, setRows] = useState<{ id: number; actor_name: string; action: string; target: string; detail: string; created_at: string }[]>([]);
  const [note, setNote] = useState("");
  useEffect(() => {
    void listAudit().then(setRows).catch((e: unknown) => setNote(msg(e)));
  }, []);
  return (
    <div>
      <h2 className="font-display text-3xl text-navy">Audit</h2>
      <p className="mt-2 text-sm text-muted">Wie heeft wat gewijzigd. Alleen zichtbaar met auditrecht, of als eigenaar.</p>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl bg-paper ring-1 ring-line">
        {rows.map((row) => (
          <li key={row.id} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-4">
            <span className="font-semibold text-navy">{row.actor_name}</span>
            <span>{row.action} · {row.target}</span>
            <span className="text-muted">{row.detail}</span>
            <span className="text-xs text-muted">{row.created_at}</span>
          </li>
        ))}
      </ul>
      <Note text={note} />
    </div>
  );
}

function FeedbackPanel({ staff }: { staff: Staff }) {
  const [name, setName] = useState(staff.displayName);
  const [email, setEmail] = useState(staff.email);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="max-w-xl rounded-3xl bg-paper p-6 ring-1 ring-line"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        setNote("");
        void sendJoshuaFeedback({ data: { name, email, message } })
          .then(() => {
            setMessage("");
            setNote("Verstuurd. Joshua ziet het in de inbox van jjjoshua3, onder Pernis.");
          })
          .catch((error: unknown) => setNote(msg(error)))
          .finally(() => setBusy(false));
      }}
    >
      <h2 className="font-display text-3xl text-navy">Feedback</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Een opmerking over de site of iets dat nog moet. Het komt direct bij Joshua binnen.
      </p>
      <label className="mt-4 block text-sm font-semibold text-navy">
        Naam
        <input className="mt-1 w-full rounded-2xl border border-line px-4 py-3 font-normal" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="mt-3 block text-sm font-semibold text-navy">
        E-mail
        <input className="mt-1 w-full rounded-2xl border border-line px-4 py-3 font-normal" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="mt-3 block text-sm font-semibold text-navy">
        Bericht
        <textarea className="mt-1 w-full rounded-2xl border border-line px-4 py-3 font-normal" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      <button type="submit" disabled={busy} className="mt-4 rounded-full bg-navy px-6 py-3 font-semibold text-paper disabled:opacity-60">
        {busy ? "Versturen…" : "Stuur naar Joshua"}
      </button>
      <Note text={note} />
    </form>
  );
}

function msg(error: unknown) {
  return error instanceof Error ? error.message : "Er ging iets mis.";
}
