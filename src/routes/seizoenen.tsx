import { createFileRoute } from "@tanstack/react-router";
import { BlocksPage } from "@/components/blocks-page";
import { getPage } from "@/lib/church/public";

export const Route = createFileRoute("/seizoenen")({
  loader: () => getPage({ data: "seizoenen" }),
  head: () => ({
    meta: [
      { title: "Seizoenen van ons geloof · Baptistengemeente Pernis" },
      { name: "description", content: "Jaarthema 2025-2026: Seizoenen van ons geloof, naar Brian McLaren." },
    ],
  }),
  component: function Seizoenen() {
    return <BlocksPage page={Route.useLoaderData()} />;
  },
});
