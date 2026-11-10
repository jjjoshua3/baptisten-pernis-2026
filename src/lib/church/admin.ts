import { createServerFn } from "@tanstack/react-start";
import { churchSessionMiddleware } from "@/lib/church/session";

export type StaffRole = "eigenaar" | "ontwikkelaar" | "beheerder" | "medewerker";

export type Staff = {
  userId: string;
  email: string;
  displayName: string;
  role: StaffRole;
  canAgenda: boolean;
  canContent: boolean;
  canUsers: boolean;
  canAudit: boolean;
};

type Perm = "agenda" | "content" | "users" | "audit";

type StaffRow = {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  can_agenda: boolean | string;
  can_content: boolean | string;
  can_users: boolean | string;
  can_audit: boolean | string;
};

function flag(value: boolean | string) {
  return value === true || value === "t" || value === "true";
}

function asRole(value: string): StaffRole {
  if (value === "eigenaar" || value === "ontwikkelaar" || value === "beheerder") return value;
  return "medewerker";
}

function fullAccess(role: StaffRole) {
  return role === "eigenaar" || role === "ontwikkelaar";
}

function mapStaff(row: StaffRow): Staff {
  const role = asRole(row.role);
  const all = fullAccess(role);
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role,
    canAgenda: all || flag(row.can_agenda),
    canContent: all || flag(row.can_content),
    canUsers: all || flag(row.can_users),
    canAudit: all || flag(row.can_audit),
  };
}

async function db() {
  const { getChurchSql } = await import("@/lib/church/remote-db");
  return getChurchSql();
}

async function loadStaff(userId: string) {
  const sql = await db();
  const rows = await sql<StaffRow>`
    select user_id, email, display_name, role, can_agenda, can_content, can_users, can_audit
    from staff where user_id = ${userId}
  `;
  return { sql, staff: rows[0] ? mapStaff(rows[0]) : null };
}

function allows(staff: Staff, perm: Perm) {
  if (fullAccess(staff.role)) return true;
  if (perm === "agenda") return staff.canAgenda;
  if (perm === "content") return staff.canContent;
  if (perm === "users") return staff.canUsers;
  return staff.canAudit;
}

async function guard(userId: string, perm: Perm) {
  const loaded = await loadStaff(userId);
  if (!loaded.staff || !allows(loaded.staff, perm)) {
    throw new Error("Je hebt geen rechten voor deze actie.");
  }
  return loaded as { sql: Awaited<ReturnType<typeof db>>; staff: Staff };
}

async function writeAudit(
  sql: Awaited<ReturnType<typeof db>>,
  staff: Staff,
  action: string,
  target: string,
  detail: string,
) {
  await sql`
    insert into audit_log (actor_id, actor_name, action, target, detail)
    values (${staff.userId}, ${staff.displayName}, ${action}, ${target}, ${detail})
  `;
}

function text(value: unknown, max: number, label: string) {
  const out = String(value ?? "").trim();
  if (!out) throw new Error(`${label} is verplicht.`);
  if (out.length > max) throw new Error(`${label} is te lang.`);
  return out;
}

function optionalText(value: unknown, max: number) {
  const out = String(value ?? "").trim();
  if (out.length > max) throw new Error("Tekst is te lang.");
  return out;
}

export const enterBeheer = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .handler(async ({ context }): Promise<Staff | null> => {
    const { staff } = await loadStaff(context.userId);
    return staff;
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: { entries: { key: string; value: string }[] }) => {
    const entries = Array.isArray(input?.entries) ? input.entries : [];
    return {
      entries: entries.slice(0, 40).map((entry) => ({
        key: text(entry.key, 60, "Sleutel"),
        value: optionalText(entry.value, 8000),
      })),
    };
  })
  .handler(async ({ context, data }) => {
    const { sql, staff } = await guard(context.userId, "content");
    for (const entry of data.entries) {
      await sql`
        insert into settings (key, value) values (${entry.key}, ${entry.value})
        on conflict (key) do update set value = ${entry.value}
      `;
    }
    await writeAudit(sql, staff, "wijziging", "gegevens", `${data.entries.length} velden`);
    return { ok: true };
  });

export const saveEvent = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: {
    id?: number;
    kind: string;
    dateLabel: string;
    title: string;
    details: string;
    sortOrder: number;
  }) => ({
    id: input.id ? Number(input.id) : 0,
    kind: input.kind === "vast" ? "vast" : "komend",
    dateLabel: text(input.dateLabel, 80, "Datum"),
    title: text(input.title, 160, "Titel"),
    details: optionalText(input.details, 2000),
    sortOrder: Number(input.sortOrder) || 0,
  }))
  .handler(async ({ context, data }) => {
    const { sql, staff } = await guard(context.userId, "agenda");
    if (data.id) {
      await sql`
        update events set kind = ${data.kind}, date_label = ${data.dateLabel}, title = ${data.title},
          details = ${data.details}, sort_order = ${data.sortOrder}
        where id = ${data.id}
      `;
    } else {
      await sql`
        insert into events (kind, date_label, title, details, sort_order)
        values (${data.kind}, ${data.dateLabel}, ${data.title}, ${data.details}, ${data.sortOrder})
      `;
    }
    await writeAudit(sql, staff, data.id ? "wijziging" : "toegevoegd", "agenda", data.title);
    return { ok: true };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((id: number) => Number(id))
  .handler(async ({ context, data: id }) => {
    const { sql, staff } = await guard(context.userId, "agenda");
    await sql`delete from events where id = ${id}`;
    await writeAudit(sql, staff, "verwijderd", "agenda", String(id));
    return { ok: true };
  });

export const saveActivity = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: {
    id?: number;
    title: string;
    audience: string;
    body: string;
    whenLabel: string;
    sortOrder: number;
  }) => ({
    id: input.id ? Number(input.id) : 0,
    title: text(input.title, 160, "Titel"),
    audience: text(input.audience, 80, "Doelgroep"),
    body: text(input.body, 6000, "Tekst"),
    whenLabel: text(input.whenLabel, 120, "Wanneer"),
    sortOrder: Number(input.sortOrder) || 0,
  }))
  .handler(async ({ context, data }) => {
    const { sql, staff } = await guard(context.userId, "content");
    if (data.id) {
      await sql`
        update activities set title = ${data.title}, audience = ${data.audience}, body = ${data.body},
          when_label = ${data.whenLabel}, sort_order = ${data.sortOrder}
        where id = ${data.id}
      `;
    } else {
      await sql`
        insert into activities (title, audience, body, when_label, sort_order)
        values (${data.title}, ${data.audience}, ${data.body}, ${data.whenLabel}, ${data.sortOrder})
      `;
    }
    await writeAudit(sql, staff, data.id ? "wijziging" : "toegevoegd", "activiteit", data.title);
    return { ok: true };
  });

export const deleteActivity = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((id: number) => Number(id))
  .handler(async ({ context, data: id }) => {
    const { sql, staff } = await guard(context.userId, "content");
    await sql`delete from activities where id = ${id}`;
    await writeAudit(sql, staff, "verwijderd", "activiteit", String(id));
    return { ok: true };
  });

export const savePage = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: { slug: string; kicker: string; title: string; lede: string }) => ({
    slug: text(input.slug, 40, "Pagina"),
    kicker: text(input.kicker, 80, "Label"),
    title: text(input.title, 160, "Titel"),
    lede: optionalText(input.lede, 500),
  }))
  .handler(async ({ context, data }) => {
    const { sql, staff } = await guard(context.userId, "content");
    await sql`
      update pages set kicker = ${data.kicker}, title = ${data.title}, lede = ${data.lede}
      where slug = ${data.slug}
    `;
    await writeAudit(sql, staff, "wijziging", "pagina", data.slug);
    return { ok: true };
  });

export const saveBlock = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: { id?: number; pageSlug?: string; heading: string; body: string; sortOrder: number }) => ({
    id: input.id ? Number(input.id) : 0,
    pageSlug: optionalText(input.pageSlug, 40),
    heading: text(input.heading, 160, "Kop"),
    body: text(input.body, 8000, "Tekst"),
    sortOrder: Number(input.sortOrder) || 0,
  }))
  .handler(async ({ context, data }) => {
    const { sql, staff } = await guard(context.userId, "content");
    if (data.id) {
      await sql`
        update page_blocks set heading = ${data.heading}, body = ${data.body}, sort_order = ${data.sortOrder}
        where id = ${data.id}
      `;
    } else {
      if (!data.pageSlug) throw new Error("Kies een pagina.");
      await sql`
        insert into page_blocks (page_slug, heading, body, sort_order)
        values (${data.pageSlug}, ${data.heading}, ${data.body}, ${data.sortOrder})
      `;
    }
    await writeAudit(sql, staff, data.id ? "wijziging" : "toegevoegd", "tekstblok", data.heading);
    return { ok: true };
  });

export const deleteBlock = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((id: number) => Number(id))
  .handler(async ({ context, data: id }) => {
    const { sql, staff } = await guard(context.userId, "content");
    await sql`delete from page_blocks where id = ${id}`;
    await writeAudit(sql, staff, "verwijderd", "tekstblok", String(id));
    return { ok: true };
  });

export const savePastor = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: {
    name: string;
    roleLabel: string;
    sinceLabel: string;
    email: string;
    phone: string;
    bio: string;
    photo: string;
  }) => {
    const photo = String(input.photo ?? "");
    if (photo.length > 1_400_000) throw new Error("De foto is te groot. Kies een bestand onder ongeveer 1 MB.");
    if (photo && !photo.startsWith("data:image/") && !photo.startsWith("https://") && !photo.startsWith("/")) {
      throw new Error("Foto moet een afbeelding zijn.");
    }
    return {
      name: text(input.name, 120, "Naam"),
      roleLabel: text(input.roleLabel, 120, "Rol"),
      sinceLabel: text(input.sinceLabel, 120, "Sinds"),
      email: text(input.email, 200, "E-mail"),
      phone: text(input.phone, 40, "Telefoon"),
      bio: text(input.bio, 8000, "Tekst"),
      photo,
    };
  })
  .handler(async ({ context, data }) => {
    const { sql, staff } = await guard(context.userId, "content");
    await sql`
      update pastor set name = ${data.name}, role_label = ${data.roleLabel}, since_label = ${data.sinceLabel},
        email = ${data.email}, phone = ${data.phone}, bio = ${data.bio}, photo = ${data.photo}
      where id = 1
    `;
    await writeAudit(sql, staff, "wijziging", "voorganger", data.name);
    return { ok: true };
  });

export const listAnnouncementsAdmin = createServerFn({ method: "GET" })
  .middleware([churchSessionMiddleware])
  .handler(async ({ context }) => {
    const { sql } = await guard(context.userId, "content");
    return sql<{ id: number; title: string; body: string; published: boolean | string }>`
      select id, title, body, published from announcements order by id desc
    `;
  });

export const saveAnnouncement = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: { id?: number; title: string; body: string; published: boolean }) => ({
    id: input.id ? Number(input.id) : 0,
    title: text(input.title, 160, "Titel"),
    body: text(input.body, 2000, "Tekst"),
    published: Boolean(input.published),
  }))
  .handler(async ({ context, data }) => {
    const { sql, staff } = await guard(context.userId, "content");
    if (data.id) {
      await sql`
        update announcements set title = ${data.title}, body = ${data.body}, published = ${data.published}
        where id = ${data.id}
      `;
    } else {
      await sql`
        insert into announcements (title, body, published)
        values (${data.title}, ${data.body}, ${data.published})
      `;
    }
    await writeAudit(sql, staff, data.id ? "wijziging" : "toegevoegd", "aankondiging", data.title);
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((id: number) => Number(id))
  .handler(async ({ context, data: id }) => {
    const { sql, staff } = await guard(context.userId, "content");
    await sql`delete from announcements where id = ${id}`;
    await writeAudit(sql, staff, "verwijderd", "aankondiging", String(id));
    return { ok: true };
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([churchSessionMiddleware])
  .handler(async ({ context }) => {
    const { sql } = await guard(context.userId, "content");
    return sql<{
      id: number;
      name: string;
      email: string;
      body: string;
      read: boolean | string;
      created_at: string;
    }>`
      select id, name, email, body, read, created_at::text as created_at
      from messages order by id desc limit 100
    `;
  });

export const setMessageRead = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: { id: number; read: boolean }) => ({
    id: Number(input.id),
    read: Boolean(input.read),
  }))
  .handler(async ({ context, data }) => {
    const { sql, staff } = await guard(context.userId, "content");
    await sql`update messages set read = ${data.read} where id = ${data.id}`;
    await writeAudit(sql, staff, "wijziging", "bericht", String(data.id));
    return { ok: true };
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((id: number) => Number(id))
  .handler(async ({ context, data: id }) => {
    const { sql, staff } = await guard(context.userId, "content");
    await sql`delete from messages where id = ${id}`;
    await writeAudit(sql, staff, "verwijderd", "bericht", String(id));
    return { ok: true };
  });

export const listStaff = createServerFn({ method: "GET" })
  .middleware([churchSessionMiddleware])
  .handler(async ({ context }) => {
    const { sql } = await guard(context.userId, "users");
    const rows = await sql<StaffRow>`
      select user_id, email, display_name, role, can_agenda, can_content, can_users, can_audit
      from staff order by created_at, display_name
    `;
    return { staff: rows.map(mapStaff), pending: [] as { id: string; name: string; email: string }[] };
  });

export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: {
    name: string;
    email: string;
    role: string;
    canAgenda: boolean;
    canContent: boolean;
    canUsers: boolean;
    canAudit: boolean;
  }) => {
    const email = text(input.email, 200, "E-mail").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Ongeldig e-mailadres.");
    const role = asRole(input.role);
    return {
      name: text(input.name, 120, "Naam"),
      email,
      role,
      canAgenda: Boolean(input.canAgenda),
      canContent: Boolean(input.canContent),
      canUsers: Boolean(input.canUsers),
      canAudit: Boolean(input.canAudit),
    };
  })
  .handler(async ({ context, data }) => {
    const { sql, staff } = await guard(context.userId, "users");
    if ((data.role === "eigenaar" || data.role === "ontwikkelaar") && !fullAccess(staff.role)) {
      throw new Error("Alleen een eigenaar of ontwikkelaar kan deze rol geven.");
    }
    const existing = await sql<{ user_id: string }>`
      select user_id from staff where lower(email) = ${data.email}
    `;
    if (existing[0]) throw new Error("Dit e-mailadres heeft al toegang.");
    const all = fullAccess(data.role);
    await sql`
      insert into staff (user_id, email, display_name, role, can_agenda, can_content, can_users, can_audit)
      values (
        ${data.email}, ${data.email}, ${data.name}, ${data.role},
        ${all || data.canAgenda}, ${all || data.canContent}, ${all || data.canUsers}, ${all || data.canAudit}
      )
    `;
    await writeAudit(sql, staff, "toegevoegd", "gebruiker", data.email);
    return { ok: true };
  });

export const grantPending = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: {
    userId: string;
    role: string;
    canAgenda: boolean;
    canContent: boolean;
    canUsers: boolean;
    canAudit: boolean;
  }) => ({
    userId: text(input.userId, 80, "Gebruiker"),
    role: asRole(input.role),
    canAgenda: Boolean(input.canAgenda),
    canContent: Boolean(input.canContent),
    canUsers: Boolean(input.canUsers),
    canAudit: Boolean(input.canAudit),
  }))
  .handler(async () => {
    throw new Error("Voeg een medewerker toe met naam en e-mail. Die krijgt dan een inloglink.");
  });

export const updateStaff = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: {
    userId: string;
    role: string;
    canAgenda: boolean;
    canContent: boolean;
    canUsers: boolean;
    canAudit: boolean;
  }) => ({
    userId: text(input.userId, 80, "Gebruiker"),
    role: asRole(input.role),
    canAgenda: Boolean(input.canAgenda),
    canContent: Boolean(input.canContent),
    canUsers: Boolean(input.canUsers),
    canAudit: Boolean(input.canAudit),
  }))
  .handler(async ({ context, data }) => {
    const { sql, staff } = await guard(context.userId, "users");
    if ((data.role === "eigenaar" || data.role === "ontwikkelaar") && !fullAccess(staff.role)) {
      throw new Error("Alleen een eigenaar of ontwikkelaar kan deze rol geven.");
    }
    const owners = await sql<{ n: number }>`
      select count(*)::int as n from staff where role = 'eigenaar' and user_id <> ${data.userId}
    `;
    if (data.role !== "eigenaar" && (owners[0]?.n ?? 0) === 0) {
      const current = await sql<{ role: string }>`select role from staff where user_id = ${data.userId}`;
      if (current[0]?.role === "eigenaar") {
        throw new Error("Er moet minstens één eigenaar blijven.");
      }
    }
    const all = fullAccess(data.role);
    await sql`
      update staff set role = ${data.role},
        can_agenda = ${all || data.canAgenda},
        can_content = ${all || data.canContent},
        can_users = ${all || data.canUsers},
        can_audit = ${all || data.canAudit}
      where user_id = ${data.userId}
    `;
    await writeAudit(sql, staff, "rechten", "gebruiker", data.userId);
    return { ok: true };
  });

export const removeStaff = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((userId: string) => text(userId, 80, "Gebruiker"))
  .handler(async ({ context, data: userId }) => {
    const { sql, staff } = await guard(context.userId, "users");
    const owners = await sql<{ n: number }>`
      select count(*)::int as n from staff where role = 'eigenaar' and user_id <> ${userId}
    `;
    const current = await sql<{ role: string; email: string }>`
      select role, email from staff where user_id = ${userId}
    `;
    if (current[0]?.role === "eigenaar" && (owners[0]?.n ?? 0) === 0) {
      throw new Error("De laatste eigenaar kan niet worden verwijderd.");
    }
    await sql`delete from staff where user_id = ${userId}`;
    await writeAudit(sql, staff, "verwijderd", "gebruiker", current[0]?.email ?? userId);
    return { ok: true };
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([churchSessionMiddleware])
  .handler(async ({ context }) => {
    const { sql } = await guard(context.userId, "audit");
    return sql<{
      id: number;
      actor_name: string;
      action: string;
      target: string;
      detail: string;
      created_at: string;
    }>`
      select id, actor_name, action, target, detail, created_at::text as created_at
      from audit_log order by id desc limit 200
    `;
  });

export const sendJoshuaFeedback = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .validator((input: { name: string; email: string; message: string }) => {
    const name = text(input?.name, 80, "Naam");
    const email = text(input?.email, 200, "E-mail").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Vul een geldig e-mailadres in.");
    const message = text(input?.message, 4000, "Bericht");
    if (message.length < 4) throw new Error("Schrijf een kort bericht.");
    return { name, email, message };
  })
  .handler(async ({ context, data }) => {
    const { sql, staff } = await loadStaff(context.userId);
    if (!staff) throw new Error("Je hebt geen rechten voor deze actie.");
    const recent = await sql<{ n: number }>`
      select count(*)::int as n from public.site_feedback
      where author_email = ${data.email} and site = 'pernis' and created_at > now() - interval '1 day'
    `;
    if ((recent[0]?.n ?? 0) >= 8) throw new Error("Te veel berichten vandaag.");
    const { randomBytes } = await import("node:crypto");
    await sql`
      insert into public.site_feedback (id, site, author_email, author_name, message, status)
      values (${randomBytes(12).toString("hex")}, 'pernis', ${data.email}, ${data.name}, ${data.message}, 'open')
    `;
    await writeAudit(sql, staff, "feedback", "joshua", data.message.slice(0, 180));
    return { ok: true };
  });

