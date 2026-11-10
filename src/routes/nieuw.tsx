import { createFileRoute } from "@tanstack/react-router";
import { BlocksPage } from "@/components/blocks-page";
import { getPage } from "@/lib/church/public";

export const Route = createFileRoute("/nieuw")({
  loader: () => getPage({ data: "nieuw" }),
  head: () => ({
    meta: [
      { title: "Nieuw hier? · Baptistengemeente Pernis" },
      { name: "description", content: "Wat je kunt verwachten in een zondagse dienst van Baptistengemeente Pernis." },
    ],
  }),
  component: function Nieuw() {
    return (
      <BlocksPage
        page={Route.useLoaderData()}
        image={{ src: "/fotos/kaarsen.jpg", alt: "Kaarsen in de kerkzaal van Baptistengemeente Pernis" }}
      />
    );
  },
});
