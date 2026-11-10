import { createFileRoute } from "@tanstack/react-router";
import { BlocksPage } from "@/components/blocks-page";
import { getPage } from "@/lib/church/public";

export const Route = createFileRoute("/kinderen")({
  loader: () => getPage({ data: "kinderen" }),
  head: () => ({
    meta: [
      { title: "Kinderen · Baptistengemeente Pernis" },
      { name: "description", content: "Crèche, zondagsschool en bijbelklas tijdens de zondagse dienst." },
    ],
  }),
  component: function Kinderen() {
    return <BlocksPage page={Route.useLoaderData()} />;
  },
});
