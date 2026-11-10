import { createServerFn } from "@tanstack/react-start";

export type Settings = Record<string, string>;

export type Block = {
  id: number;
  heading: string;
  body: string;
  sortOrder: number;
};

export type PageDoc = {
  slug: string;
  kicker: string;
  title: string;
  lede: string;
  blocks: Block[];
};

export type Activity = {
  id: number;
  title: string;
  audience: string;
  body: string;
  whenLabel: string;
  sortOrder: number;
};

export type ChurchEvent = {
  id: number;
  kind: "vast" | "komend";
  dateLabel: string;
  title: string;
  details: string;
  sortOrder: number;
};

export type Pastor = {
  name: string;
  roleLabel: string;
  sinceLabel: string;
  email: string;
  phone: string;
  bio: string;
  photo: string;
};

export type Announcement = {
  id: number;
  title: string;
  body: string;
  published: boolean;
};

const SLUGS = [
  "gemeente",
  "kinderen",
  "lid-worden",
  "bijdragen",
  "anbi",
  "nieuw",
  "seizoenen",
  "diaconie",
] as const;

export type PageSlug = (typeof SLUGS)[number];

function isSlug(value: string): value is PageSlug {
  return (SLUGS as readonly string[]).includes(value);
}

async function sql() {
  const { getChurchSql } = await import("@/lib/church/remote-db");
  return getChurchSql();
}

function mapSettings(rows: { key: string; value: string }[]): Settings {
  const out: Settings = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const db = await sql();
  const rows = await db<{ key: string; value: string }>`select key, value from settings`;
  return mapSettings(rows);
});

export const getPage = createServerFn({ method: "GET" })
  .validator((slug: string) => {
    if (!isSlug(slug)) throw new Error("Onbekende pagina");
    return slug;
  })
  .handler(async ({ data: slug }): Promise<PageDoc> => {
    const db = await sql();
    const pages = await db<{ slug: string; kicker: string; title: string; lede: string }>`
      select slug, kicker, title, lede from pages where slug = ${slug}
    `;
    const page = pages[0];
    if (!page) throw new Error("Pagina niet gevonden");
    const blocks = await db<{ id: number; heading: string; body: string; sort_order: number }>`
      select id, heading, body, sort_order from page_blocks
      where page_slug = ${slug}
      order by sort_order, id
    `;
    return {
      ...page,
      blocks: blocks.map((b) => ({
        id: b.id,
        heading: b.heading,
        body: b.body,
        sortOrder: b.sort_order,
      })),
    };
  });

export const getActivities = createServerFn({ method: "GET" }).handler(async () => {
  const db = await sql();
  const rows = await db<{
    id: number;
    title: string;
    audience: string;
    body: string;
    when_label: string;
    sort_order: number;
  }>`select id, title, audience, body, when_label, sort_order from activities order by sort_order, id`;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    audience: r.audience,
    body: r.body,
    whenLabel: r.when_label,
    sortOrder: r.sort_order,
  })) satisfies Activity[];
});

const MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

/** True when a dated agenda line is before today in Amsterdam. Recurring lines stay. */
export function eventIsPast(dateLabel: string, now = new Date()) {
  const match = dateLabel.toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (!match) return false;
  const month = MONTHS.indexOf(match[2]);
  if (month < 0) return false;
  const eventKey = `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return eventKey < today;
}

export const getEvents = createServerFn({ method: "GET" }).handler(async () => {
  const db = await sql();
  const rows = await db<{
    id: number;
    kind: string;
    date_label: string;
    title: string;
    details: string;
    sort_order: number;
  }>`select id, kind, date_label, title, details, sort_order from events order by kind desc, sort_order, id`;
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind === "vast" ? "vast" : "komend",
    dateLabel: r.date_label,
    title: r.title,
    details: r.details,
    sortOrder: r.sort_order,
  })) satisfies ChurchEvent[];
});

export const getPastor = createServerFn({ method: "GET" }).handler(async () => {
  const db = await sql();
  const rows = await db<{
    name: string;
    role_label: string;
    since_label: string;
    email: string;
    phone: string;
    bio: string;
    photo: string;
  }>`select name, role_label, since_label, email, phone, bio, photo from pastor where id = 1`;
  const row = rows[0];
  if (!row) throw new Error("Voorganger niet gevonden");
  return {
    name: row.name,
    roleLabel: row.role_label,
    sinceLabel: row.since_label,
    email: row.email,
    phone: row.phone,
    bio: row.bio,
    photo: row.photo ?? "",
  } satisfies Pastor;
});

export const getAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const db = await sql();
  const rows = await db<{ id: number; title: string; body: string }>`
    select id, title, body from announcements
    where published = true
    order by id desc
    limit 3
  `;
  return rows.map((r) => ({ id: r.id, title: r.title, body: r.body, published: true }));
});

export const sendMessage = createServerFn({ method: "POST" })
  .validator((input: { name: string; email: string; body: string }) => {
    const name = String(input?.name ?? "").trim();
    const email = String(input?.email ?? "").trim();
    const body = String(input?.body ?? "").trim();
    if (name.length < 2 || name.length > 120) throw new Error("Vul je naam in.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      throw new Error("Vul een geldig e-mailadres in.");
    }
    if (body.length < 5 || body.length > 4000) throw new Error("Schrijf een kort bericht.");
    return { name, email, body };
  })
  .handler(async ({ data }) => {
    const db = await sql();
    await db`insert into messages (name, email, body) values (${data.name}, ${data.email}, ${data.body})`;
    return { ok: true };
  });

export const hasStaff = createServerFn({ method: "GET" }).handler(async () => {
  const db = await sql();
  const rows = await db<{ n: number }>`select count(*)::int as n from staff`;
  return (rows[0]?.n ?? 0) > 0;
});

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const db = await sql();
  const settings = mapSettings(await db<{ key: string; value: string }>`select key, value from settings`);
  const announcements = await db<{ id: number; title: string; body: string }>`
    select id, title, body from announcements where published = true order by id desc limit 2
  `;
  const activities = await db<{
    id: number;
    title: string;
    audience: string;
    body: string;
    when_label: string;
  }>`select id, title, audience, body, when_label from activities order by sort_order, id limit 3`;
  const upcoming = await db<{ id: number; date_label: string; title: string; details: string }>`
    select id, date_label, title, details from events where kind = 'komend' order by sort_order, id limit 24
  `;
  return {
    settings,
    announcements,
    activities: activities.map((a) => ({
      id: a.id,
      title: a.title,
      audience: a.audience,
      body: a.body,
      whenLabel: a.when_label,
    })),
    upcoming: upcoming
      .map((e) => ({
        id: e.id,
        dateLabel: e.date_label,
        title: e.title,
        details: e.details,
      }))
      .filter((e) => !eventIsPast(e.dateLabel))
      .slice(0, 3),
  };
});
