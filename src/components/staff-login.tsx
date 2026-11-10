import { useEffect, useState } from "react";
import { confirmChurchTotp, consumeChurchLink, requestChurchLink } from "@/lib/church/login";

const SESSION_KEY = "pernis_session";

export function StaffLogin({ title = "Beheer", magic = "" }: { title?: string; magic?: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [step, setStep] = useState<"setup" | "challenge" | "">("");
  const [token, setToken] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    if (!magic) return;
    setPending(true);
    void consumeChurchLink({ data: { token: magic } })
      .then((result) => {
        if (result.step === "skip") {
          sessionStorage.setItem(SESSION_KEY, result.token);
          window.location.href = "/admin";
          return;
        }
        setToken(result.token);
        setStep(result.step);
        setQr(result.qr);
        setSecret(result.secret);
        setPending(false);
        window.history.replaceState({}, "", "/admin");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Deze link is ongeldig of verlopen.");
        setPending(false);
      });
  }, [magic]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <img src="/fotos/zaal.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-navy/80 via-navy/55 to-navy/75" />
      <div className="relative grid min-h-screen place-items-center px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/30 bg-paper/95 p-8 shadow-2xl backdrop-blur-md">
        <img src="/logo.png" alt="" className="h-14 w-14 rounded-2xl bg-white object-contain p-1" />
        <h1 className="mt-5 font-display text-3xl text-navy">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Vul het e-mailadres in dat de beheerder heeft toegevoegd. Je krijgt een link die dertig minuten
          geldig is en één keer werkt.
        </p>
        {step ? (
          <form
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const code = String(new FormData(event.currentTarget).get("code") ?? "");
              setPending(true);
              setError("");
              void confirmChurchTotp({ data: { token, code } })
                .then((result) => {
                  sessionStorage.setItem(SESSION_KEY, result.token);
                  window.location.href = "/admin";
                })
                .catch((err: unknown) => {
                  setError(err instanceof Error ? err.message : "De code is onjuist.");
                  setPending(false);
                });
            }}
          >
            <p className="text-sm text-navy">
              {step === "setup"
                ? "Scan deze code één keer met een authenticator-app. Daarna vul je de zes cijfers in."
                : "Vul de zes cijfers uit je authenticator in."}
            </p>
            {qr ? <img src={qr} alt="Authenticator-code" className="mx-auto h-48 w-48 rounded-2xl bg-white" /> : null}
            {secret ? <p className="break-all text-center text-xs text-muted">{secret}</p> : null}
            <input name="code" inputMode="numeric" autoComplete="one-time-code" required placeholder="6 cijfers" className="w-full rounded-2xl border border-line px-4 py-3" />
            <button type="submit" disabled={pending} className="w-full rounded-full bg-navy py-3 font-semibold text-paper disabled:opacity-60">
              {pending ? "Bezig…" : "Bevestigen"}
            </button>
          </form>
        ) : (
          <form
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const email = String(new FormData(event.currentTarget).get("email") ?? "");
              setPending(true);
              setError("");
              void requestChurchLink({ data: { email } })
                .then(() => {
                  setSent(true);
                  setPending(false);
                })
                .catch((err: unknown) => {
                  setError(err instanceof Error ? err.message : "De link kon niet worden verstuurd.");
                  setPending(false);
                });
            }}
          >
            <input name="email" type="email" required placeholder="E-mail" className="w-full rounded-2xl border border-line px-4 py-3" />
            <button type="submit" disabled={pending} className="w-full rounded-full bg-navy py-3 font-semibold text-paper disabled:opacity-60">
              {pending ? "Bezig…" : "Stuur inloglink"}
            </button>
          </form>
        )}
        {sent ? <p className="mt-3 text-sm text-navy">De link staat in je mail. Open die op dit apparaat.</p> : null}
        {error ? <p className="mt-3 text-sm text-navy">{error}</p> : null}
      </div>
      </div>
    </div>
  );
}
