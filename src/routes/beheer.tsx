import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/beheer")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : "overzicht",
    magic: typeof search.magic === "string" ? search.magic : "",
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/admin", search });
  },
});
