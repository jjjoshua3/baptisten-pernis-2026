import { createServerFn } from "@tanstack/react-start";

const SESSION_COOKIE = "pernis_session";
const TOTP_CHANCE = 0.28;

async function hashToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

function emailOf(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Vul een geldig e-mailadres in.");
  return email;
}

async function origin() {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const proto = (request?.headers.get("x-forwarded-proto") || "https").split(",")[0]?.trim() || "https";
  const host = (request?.headers.get("x-forwarded-host") || request?.headers.get("host") || "")
    .split(",")[0]
    ?.trim();
  if (!host) return "https://baptistenpernis.nl";
  return `${proto}://${host}`;
}

async function sendLink(email: string, name: string, link: string) {
  const { churchSecrets } = await import("./remote-db");
  const password = churchSecrets().gmailAppPassword;
  if (!password) throw new Error("De mailserver is nog niet ingesteld.");
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: "aa0271n8@gmail.com", pass: password },
  });
  await transport.sendMail({
    from: "Baptistengemeente Pernis <aa0271n8@gmail.com>",
    to: email,
    subject: "Inloglink beheer Baptistengemeente Pernis",
    text: `Hoi ${name},\n\nHier is je inloglink voor het beheer. De link is 30 minuten geldig en werkt één keer.\n\n${link}\n`,
    html: `<p>Hoi ${name},</p><p>Hier is je inloglink voor het beheer. De link is 30 minuten geldig en werkt één keer.</p><p><a href="${link}">Open het beheer</a></p>`,
  });
}

async function totpFor(email: string, secret: string) {
  const { TOTP, Secret } = await import("otpauth");
  return new TOTP({
    issuer: "Baptistengemeente Pernis",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}

async function codeOk(email: string, secret: string, code: string) {
  const value = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(value)) return false;
  const totp = await totpFor(email, secret);
  return totp.validate({ token: value, window: 1 }) !== null;
}

export const requestChurchLink = createServerFn({ method: "POST" })
  .validator((input: { email?: string }) => ({ email: emailOf(input?.email) }))
  .handler(async ({ data }) => {
    const { randomBytes, randomUUID } = await import("node:crypto");
    const { getChurchSql } = await import("./remote-db");
    const sql = await getChurchSql();
    const found = await sql<{ email: string; display_name: string }>`
      select email, display_name from staff where lower(email) = ${data.email}
    `;
    const account = found[0];
    if (!account) throw new Error("Dit e-mailadres heeft geen toegang.");
    const recent = await sql<{ n: number }>`
      select count(*)::int as n from login_link
      where email = ${data.email} and created_at > now() - interval '1 hour'
    `;
    if ((recent[0]?.n ?? 0) >= 5) throw new Error("Er zijn net al meerdere links gestuurd. Wacht een uur.");
    const token = randomBytes(32).toString("base64url");
    await sql`
      insert into login_link (id, email, token_hash, expires_at)
      values (${randomUUID()}, ${data.email}, ${await hashToken(token)}, now() + interval '30 minutes')
    `;
    const link = `${await origin()}/admin?magic=${encodeURIComponent(token)}`;
    await sendLink(data.email, account.display_name, link);
    return { ok: true as const };
  });

export const consumeChurchLink = createServerFn({ method: "POST" })
  .validator((input: { token?: string }) => {
    const token = String(input?.token ?? "").trim();
    if (token.length < 20 || token.length > 200) throw new Error("Deze link is ongeldig of verlopen.");
    return { token };
  })
  .handler(async ({ data }) => {
    const { randomBytes } = await import("node:crypto");
    const { getChurchSql } = await import("./remote-db");
    const sql = await getChurchSql();
    const found = await sql<{ id: string; email: string }>`
      select id, email from login_link
      where token_hash = ${await hashToken(data.token)} and used_at is null and expires_at > now()
    `;
    const row = found[0];
    if (!row) throw new Error("Deze link is ongeldig of verlopen.");
    const staff = await sql<{ email: string }>`
      select email from staff where lower(email) = ${row.email}
    `;
    if (!staff[0]) throw new Error("Deze link is ongeldig of verlopen.");
    await sql`update login_link set used_at = now() where id = ${row.id}`;
    const session = randomBytes(32).toString("base64url");
    const totpRows = await sql<{ secret: string; enabled: boolean; last_verified_at: string | null }>`
      select secret, enabled, last_verified_at::text as last_verified_at from login_totp where email = ${row.email}
    `;
    const totp = totpRows[0];
    let step: "skip" | "setup" | "challenge" = "skip";
    if (!totp?.enabled) step = "setup";
    else {
      const stale =
        !totp.last_verified_at || Date.now() - new Date(totp.last_verified_at).getTime() > 14 * 24 * 60 * 60 * 1000;
      if (stale || Math.random() < TOTP_CHANCE) step = "challenge";
    }
    await sql`
      insert into login_session (token_hash, email, totp_ok, expires_at)
      values (${await hashToken(session)}, ${row.email}, ${step === "skip"}, now() + interval '14 days')
    `;
    if (step === "skip" && totp) {
      await sql`update login_totp set login_count = login_count + 1 where email = ${row.email}`;
    }
    let qr = "";
    let secret = "";
    if (step === "setup") {
      const { Secret } = await import("otpauth");
      secret = totp?.secret || new Secret({ size: 20 }).base32;
      if (!totp) await sql`insert into login_totp (email, secret) values (${row.email}, ${secret})`;
      const made = await totpFor(row.email, secret);
      const QRCode = await import("qrcode");
      qr = await QRCode.toDataURL(made.toString(), { margin: 1, width: 240 });
    }
    if (step === "skip") {
      const { setCookie } = await import("@tanstack/react-start/server");
      setCookie(SESSION_COOKIE, session, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 14 });
    }
    return { ok: true as const, step, token: session, qr, secret };
  });

export const confirmChurchTotp = createServerFn({ method: "POST" })
  .validator((input: { token?: string; code?: string }) => {
    const token = String(input?.token ?? "").trim();
    const code = String(input?.code ?? "").trim();
    if (token.length < 20) throw new Error("Log opnieuw in.");
    return { token, code };
  })
  .handler(async ({ data }) => {
    const { getChurchSql } = await import("./remote-db");
    const sql = await getChurchSql();
    const tokenHash = await hashToken(data.token);
    const sessions = await sql<{ email: string }>`
      select email from login_session where token_hash = ${tokenHash} and expires_at > now()
    `;
    const email = sessions[0]?.email;
    if (!email) throw new Error("Log opnieuw in.");
    const rows = await sql<{ secret: string }>`select secret from login_totp where email = ${email}`;
    if (!rows[0] || !(await codeOk(email, rows[0].secret, data.code))) {
      throw new Error("De code is onjuist.");
    }
    await sql`
      update login_totp set enabled = true, login_count = login_count + 1, last_verified_at = now()
      where email = ${email}
    `;
    await sql`update login_session set totp_ok = true where token_hash = ${tokenHash}`;
    const { setCookie } = await import("@tanstack/react-start/server");
    setCookie(SESSION_COOKIE, data.token, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 14 });
    return { ok: true as const, token: data.token };
  });

export const logoutChurch = createServerFn({ method: "POST" })
  .validator((input: { token?: string }) => ({ token: String(input?.token ?? "") }))
  .handler(async ({ data }) => {
    const { getCookie, setCookie } = await import("@tanstack/react-start/server");
    const token = data.token || getCookie(SESSION_COOKIE) || "";
    if (token) {
      const { getChurchSql } = await import("./remote-db");
      const sql = await getChurchSql();
      await sql`delete from login_session where token_hash = ${await hashToken(token)}`;
    }
    setCookie(SESSION_COOKIE, "", { path: "/", httpOnly: true, sameSite: "lax", maxAge: 0 });
    return { ok: true as const };
  });
