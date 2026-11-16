import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { requireClientRole } from "@/features/auth/route-guard";

export const Route = createFileRoute("/client")({
  beforeLoad: async ({ location }) => {
    await requireClientRole("client", location.pathname);
    if (location.pathname === "/client" || location.pathname === "/client/") {
      throw redirect({ to: "/" });
    }
  },
  component: Outlet,
});
