import { createFileRoute } from "@tanstack/react-router";
import { BlocksPage } from "@/components/blocks-page";
import { getPage } from "@/lib/church/public";

export const Route = createFileRoute("/anbi")({
  loader: () => getPage({ data: "anbi" }),
  head: () => ({
    meta: [
      { title: "ANBI · Baptistengemeente Pernis" },
      { name: "description", content: "ANBI-gegevens van Baptistengemeente Pernis. Giften zijn onder voorwaarden aftrekbaar." },
    ],
  }),
  component: function Anbi() {
    return <BlocksPage page={Route.useLoaderData()} />;
  },
});
