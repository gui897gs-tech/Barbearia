import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireClientRole } from "@/features/auth/route-guard";

export const Route = createFileRoute("/owner")({
  beforeLoad: ({ location }) => requireClientRole("owner", location.pathname),
  component: Outlet,
});
