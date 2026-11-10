import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { getSettings, sendMessage } from "@/lib/church/public";

export const Route = createFileRoute("/contact")({
  loader: () => getSettings(),
  head: () => ({
    meta: [
      { title: "Contact · Baptistengemeente Pernis" },
      { name: "description", content: "Adres, e-mail en contactformulier van Baptistengemeente Pernis, Ring 322." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const settings = Route.useLoaderData();
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <Shell>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl text-navy">Contact</h1>
          <p className="mt-4 text-lg text-muted">Heb je een vraag of wil je een keer langskomen? We horen graag van je.</p>
          <dl className="mt-8 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-navy">Adres</dt>
              <dd className="mt-1">
                {settings.address_name}<br />
                {settings.address_building}<br />
                {settings.address_street}<br />
                {settings.address_postal}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy">E-mail</dt>
              <dd className="mt-1">
                <a className="text-gold-deep" href={`mailto:${settings.email}`}>{settings.email}</a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy">Dienst</dt>
              <dd className="mt-1">{settings.service_line}</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy">KvK</dt>
              <dd className="mt-1">{settings.kvk}</dd>
            </div>
          </dl>
        </div>
        <form
          className="rounded-3xl bg-paper p-7 shadow-sm ring-1 ring-line"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setPending(true);
            setStatus("");
            void sendMessage({
              data: {
                name: String(form.get("name") ?? ""),
                email: String(form.get("email") ?? ""),
                body: String(form.get("body") ?? ""),
              },
            })
              .then(() => {
                setStatus("Bedankt. We hebben je bericht ontvangen.");
                event.currentTarget.reset();
              })
              .catch((error: unknown) => {
                setStatus(error instanceof Error ? error.message : "Versturen lukte niet.");
              })
              .finally(() => setPending(false));
          }}
        >
          <label className="block text-sm font-medium text-navy">
            Naam
            <input name="name" required className="mt-1 w-full rounded-2xl border border-line bg-cream px-4 py-3" />
          </label>
          <label className="mt-4 block text-sm font-medium text-navy">
            E-mail
            <input name="email" type="email" required className="mt-1 w-full rounded-2xl border border-line bg-cream px-4 py-3" />
          </label>
          <label className="mt-4 block text-sm font-medium text-navy">
            Bericht
            <textarea name="body" required rows={6} className="mt-1 w-full rounded-2xl border border-line bg-cream px-4 py-3" />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-5 w-full rounded-full bg-navy px-5 py-3 font-semibold text-paper disabled:opacity-60"
          >
            {pending ? "Versturen…" : "Verstuur bericht"}
          </button>
          {status ? <p className="mt-3 text-sm text-navy">{status}</p> : null}
        </form>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="overflow-hidden rounded-3xl ring-1 ring-line">
          <iframe
            title="Kaart van Baptistengemeente Pernis"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4925.334531414876!2d4.382004676493858!3d51.88528597190165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c4359210ddb7d3%3A0xd5cce0c64afd0dc4!2sBaptistengemeente%20Pernis!5e0!3m2!1snl!2snl!4v1784326712764!5m2!1snl!2snl"
            className="h-80 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </Shell>
  );
}
