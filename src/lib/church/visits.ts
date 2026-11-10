import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { churchSessionMiddleware } from "@/lib/church/session";

async function db() {
  const { getChurchSql } = await import("@/lib/church/remote-db");
  return getChurchSql();
}

function clientPlace(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for") || "";
  const ip = (headers.get("x-nf-client-connection-ip") || forwarded.split(",")[0] || "").trim();
  let country = headers.get("x-country") || headers.get("cf-ipcountry") || "";
  let city = headers.get("x-city") || headers.get("x-nf-city") || "";
  const raw = headers.get("x-nf-geo");
  if (raw) {
    try {
      const geo = JSON.parse(raw) as { country?: { code?: string }; city?: string };
      country = country || geo.country?.code || "";
      city = city || geo.city || "";
    } catch {
      city = city;
    }
  }
  const key = createHash("sha256")
    .update(`${ip || "onbekend"}|pernis-bezoek`)
    .digest("hex")
    .slice(0, 32);
  return { key, country: country.slice(0, 8), city: city.slice(0, 80) };
}

export const recordVisit = createServerFn({ method: "POST" })
  .validator((input: { path?: string }) => {
    const path = String(input?.path ?? "/").split("?")[0].slice(0, 120);
    if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/admin") || path.startsWith("/beheer")) {
      return { path: "" };
    }
    return { path };
  })
  .handler(async ({ data }) => {
    if (!data.path) return { ok: true };
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const place = clientPlace(request?.headers ?? new Headers());
    const sql = await db();
    const recent = await sql<{ n: number }>`
      select count(*)::int as n from page_view
      where visitor_key = ${place.key} and path = ${data.path} and created_at > now() - interval '30 seconds'
    `;
    if ((recent[0]?.n ?? 0) > 0) return { ok: true };
    await sql`
      insert into page_view (visitor_key, path, country, city)
      values (${place.key}, ${data.path}, ${place.country}, ${place.city})
    `;
    return { ok: true };
  });

export type VisitStats = {
  viewsDay: number;
  peopleDay: number;
  viewsWeek: number;
  peopleWeek: number;
  viewsMonth: number;
  peopleMonth: number;
  days: { day: string; views: number; people: number }[];
  places: { country: string; city: string; people: number; views: number }[];
};

export const listVisits = createServerFn({ method: "POST" })
  .middleware([churchSessionMiddleware])
  .handler(async ({ context }): Promise<VisitStats> => {
    const sql = await db();
    const staff = await sql<{ role: string }>`select role from staff where user_id = ${context.userId}`;
    if (!staff[0]) throw new Error("Je hebt geen rechten voor deze actie.");
    const totals = await sql<{
      views_day: number;
      people_day: number;
      views_week: number;
      people_week: number;
      views_month: number;
      people_month: number;
    }>`
      select
        count(*) filter (where viewed_on = current_date)::int as views_day,
        count(distinct visitor_key) filter (where viewed_on = current_date)::int as people_day,
        count(*) filter (where viewed_on >= current_date - 6)::int as views_week,
        count(distinct visitor_key) filter (where viewed_on >= current_date - 6)::int as people_week,
        count(*)::int as views_month,
        count(distinct visitor_key)::int as people_month
      from page_view
      where viewed_on >= current_date - 29
    `;
    const days = await sql<{ day: string; views: number; people: number }>`
      select viewed_on::text as day, count(*)::int as views, count(distinct visitor_key)::int as people
      from page_view
      where viewed_on >= current_date - 13
      group by viewed_on
      order by viewed_on
    `;
    const places = await sql<{ country: string; city: string; people: number; views: number }>`
      select country, city, count(distinct visitor_key)::int as people, count(*)::int as views
      from page_view
      where viewed_on >= current_date - 29
      group by country, city
      order by people desc, views desc
      limit 12
    `;
    const row = totals[0];
    return {
      viewsDay: row?.views_day ?? 0,
      peopleDay: row?.people_day ?? 0,
      viewsWeek: row?.views_week ?? 0,
      peopleWeek: row?.people_week ?? 0,
      viewsMonth: row?.views_month ?? 0,
      peopleMonth: row?.people_month ?? 0,
      days,
      places,
    };
  });
