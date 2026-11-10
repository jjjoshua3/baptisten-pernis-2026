import { createFileRoute } from "@tanstack/react-router";
import { BlocksPage } from "@/components/blocks-page";
import { getPage } from "@/lib/church/public";

export const Route = createFileRoute("/diaconie")({
  loader: () => getPage({ data: "diaconie" }),
  head: () => ({
    meta: [
      { title: "Diaconie en pastoraat · Baptistengemeente Pernis" },
      { name: "description", content: "Diaconale hulp en pastoraat van Baptistengemeente Pernis, dichtbij en verder weg." },
    ],
  }),
  component: function Diaconie() {
    return <BlocksPage page={Route.useLoaderData()} />;
  },
});
