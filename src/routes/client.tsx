import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireClientRole } from "@/features/auth/route-guard";

export const Route = createFileRoute("/client")({
  beforeLoad: ({ location }) => requireClientRole("client", location.pathname),
  component: Outlet,
});
