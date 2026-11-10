import { createMiddleware } from "@tanstack/react-start";

export const CHURCH_SESSION_KEY = "pernis_session";

export const churchSessionMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    let sessionToken: string | undefined;
    try {
      sessionToken = sessionStorage.getItem(CHURCH_SESSION_KEY) || undefined;
    } catch {
      sessionToken = undefined;
    }
    return next({ sendContext: { sessionToken } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { getCookie } = await import("@tanstack/react-start/server");
    const { createHash } = await import("node:crypto");
    assertSameSiteRequest();
    const fromClient = typeof context.sessionToken === "string" ? context.sessionToken : "";
    const token = fromClient || getCookie(CHURCH_SESSION_KEY) || "";
    if (!token) throw new Error("Log opnieuw in.");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { getChurchSql } = await import("./remote-db");
    const sql = await getChurchSql();
    const rows = await sql<{ email: string }>`
      select email from login_session
      where token_hash = ${tokenHash} and totp_ok = true and expires_at > now()
    `;
    const email = rows[0]?.email?.trim().toLowerCase() ?? "";
    if (!email) throw new Error("Log opnieuw in.");
    return next({ context: { userId: email } });
  });
