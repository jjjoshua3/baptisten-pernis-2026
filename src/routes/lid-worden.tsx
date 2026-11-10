import { createFileRoute } from "@tanstack/react-router";
import { BlocksPage } from "@/components/blocks-page";
import { getPage } from "@/lib/church/public";

export const Route = createFileRoute("/lid-worden")({
  loader: () => getPage({ data: "lid-worden" }),
  head: () => ({
    meta: [
      { title: "Lid worden · Baptistengemeente Pernis" },
      { name: "description", content: "Lid of vriend worden van Baptistengemeente Pernis." },
    ],
  }),
  component: function LidWorden() {
    return <BlocksPage page={Route.useLoaderData()} />;
  },
});
