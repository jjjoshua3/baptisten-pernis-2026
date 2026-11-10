import { createFileRoute } from "@tanstack/react-router";
import { BlocksPage } from "@/components/blocks-page";
import { getPage } from "@/lib/church/public";

export const Route = createFileRoute("/gemeente")({
  loader: () => getPage({ data: "gemeente" }),
  head: () => ({
    meta: [
      { title: "Gemeente · Baptistengemeente Pernis" },
      { name: "description", content: "Geschiedenis, leden, bestuur en vrienden van Baptistengemeente Pernis." },
    ],
  }),
  component: function Gemeente() {
    return (
      <BlocksPage
        page={Route.useLoaderData()}
        image={{ src: "/fotos/sfeer-3.jpg", alt: "Kerkzaal van Gemeentecentrum De Heuvel, met kruis en glas-in-lood" }}
      />
    );
  },
});
