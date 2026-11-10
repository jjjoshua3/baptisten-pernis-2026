import { createFileRoute } from "@tanstack/react-router";
import { BlocksPage } from "@/components/blocks-page";
import { getPage } from "@/lib/church/public";

export const Route = createFileRoute("/bijdragen")({
  loader: () => getPage({ data: "bijdragen" }),
  head: () => ({
    meta: [
      { title: "Bijdragen · Baptistengemeente Pernis" },
      { name: "description", content: "Bijdragen met tijd, talent of een gift aan Baptistengemeente Pernis." },
    ],
  }),
  component: function Bijdragen() {
    return <BlocksPage page={Route.useLoaderData()} />;
  },
});
