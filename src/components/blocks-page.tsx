import { Shell, Paragraphs } from "@/components/shell";
import type { PageDoc } from "@/lib/church/public";

export function BlocksPage({
  page,
  image,
}: {
  page: PageDoc;
  image?: { src: string; alt: string };
}) {
  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold-deep">{page.kicker}</p>
        <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">{page.title}</h1>
        {page.lede ? <p className="mt-5 text-lg text-muted">{page.lede}</p> : null}
        {image ? (
          <img src={image.src} alt={image.alt} width={1024} height={577} loading="lazy" className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover" />
        ) : null}
        <div className="mt-10 space-y-6">
          {page.blocks.map((block) => (
            <article key={block.id} className="rounded-3xl bg-paper p-7 shadow-sm ring-1 ring-line">
              <h2 className="font-display text-2xl text-navy">{block.heading}</h2>
              <div className="mt-4 text-ink">
                <Paragraphs text={block.body} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}
