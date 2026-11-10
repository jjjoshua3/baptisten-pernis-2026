import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import type { Sql } from "@/lib/db";
import sql0002 from "../../../migrations/0002_church.sql?raw";
import sql0003 from "../../../migrations/0003_pages.sql?raw";
import sql0004 from "../../../migrations/0004_login.sql?raw";
import sql0005 from "../../../migrations/0005_staff_roles.sql?raw";

type Secrets = { databaseUrl?: string; gmailAppPassword?: string };

const globalRef = globalThis as typeof globalThis & {
  __pernisSql__?: Promise<Sql>;
};

export function churchSecrets(): Secrets {
  const fromEnv: Secrets = {
    databaseUrl: process.env.PERNIS_DATABASE_URL?.trim() || undefined,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "") || undefined,
  };
  let fromFile: Secrets = {};
  try {
    fromFile = JSON.parse(readFileSync(join(process.cwd(), ".secrets", "pernis.json"), "utf8")) as Secrets;
  } catch {
    fromFile = {};
  }
  return {
    databaseUrl: fromEnv.databaseUrl || fromFile.databaseUrl?.trim() || undefined,
    gmailAppPassword:
      fromEnv.gmailAppPassword || fromFile.gmailAppPassword?.replace(/\s/g, "") || undefined,
  };
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
    const files = [
      { name: "0002_church.sql", text: sql0002 },
      { name: "0003_pages.sql", text: sql0003 },
      { name: "0004_login.sql", text: sql0004 },
      { name: "0005_staff_roles.sql", text: sql0005 },
    ];
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
    ssl: databaseUrl.includes("supabase") || databaseUrl.includes("pooler") ? { rejectUnauthorized: false } : undefined,
    max: 1,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });
  pool.on("error", () => undefined);
  await migratePernis(pool);
  const seen = new WeakSet<pg.PoolClient>();
  return toSql(async <T>(text: string, params: unknown[]) => {
    const client = await pool.connect();
    try {
      if (!seen.has(client)) {
        await client.query("set search_path to pernis");
        seen.add(client);
      }
      const result = await client.query(text, params);
      return result.rows as T[];
    } finally {
      client.release();
    }
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
