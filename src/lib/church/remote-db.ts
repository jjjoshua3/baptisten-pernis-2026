import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import type { Sql } from "@/lib/db";

type Secrets = { databaseUrl?: string; gmailAppPassword?: string };

const globalRef = globalThis as typeof globalThis & {
  __pernisSql__?: Promise<Sql>;
};

export function churchSecrets(): Secrets {
  const fromEnv: Secrets = {
    databaseUrl: process.env.PERNIS_DATABASE_URL?.trim() || undefined,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "") || undefined,
  };
  if (fromEnv.databaseUrl || fromEnv.gmailAppPassword) return fromEnv;
  try {
    const parsed = JSON.parse(readFileSync(join(process.cwd(), ".secrets", "pernis.json"), "utf8")) as Secrets;
    return {
      databaseUrl: parsed.databaseUrl?.trim() || undefined,
      gmailAppPassword: parsed.gmailAppPassword?.replace(/\s/g, "") || undefined,
    };
  } catch {
    return {};
  }
}

function toSql(run: <T>(text: string, params: unknown[]) => Promise<T[]>): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
    return run<T>(text, values);
  }) as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params?: unknown[]) => run<T>(text, params ?? []);
  return sql;
}

async function migratePernis(pool: pg.Pool) {
  const client = await pool.connect();
  try {
    await client.query("create schema if not exists pernis");
    await client.query("set search_path to pernis");
    await client.query(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const applied = new Set(
      (await client.query<{ name: string }>("select name from _migrations")).rows.map((row) => row.name),
    );
    // Bundled with the function. The Netlify runtime has no migrations/ folder on disk.
    const bundled = import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    const files = Object.keys(bundled)
      .map((path) => ({ name: path.split("/").pop() ?? path, text: bundled[path] }))
      .filter((file) => file.name.endsWith(".sql") && file.name !== "0001_auth.sql")
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const file of files) {
      if (applied.has(file.name)) continue;
      await client.query("begin");
      try {
        await client.query(file.text);
        await client.query("insert into _migrations (name) values ($1)", [file.name]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
  } finally {
    client.release();
  }
}

async function createPernisSql(databaseUrl: string): Promise<Sql> {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    max: 3,
    connectionTimeoutMillis: 8000,
    options: "-c search_path=pernis",
  });
  await migratePernis(pool);
  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pool.query(text, params);
    return result.rows as T[];
  });
}

/** Church data lives in schema `pernis` on the shared Supabase. Falls back to the app database. */
export function getChurchSql(): Promise<Sql> {
  const databaseUrl = churchSecrets().databaseUrl;
  if (!databaseUrl) {
    return import("@/lib/db").then(({ getSql }) => getSql());
  }
  globalRef.__pernisSql__ ??= createPernisSql(databaseUrl).catch((error) => {
    globalRef.__pernisSql__ = undefined;
    throw error;
  });
  return globalRef.__pernisSql__;
}
