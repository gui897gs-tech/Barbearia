import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireClientRole } from "@/features/auth/route-guard";

export const Route = createFileRoute("/barber")({
  beforeLoad: ({ location }) => requireClientRole("barber", location.pathname),
  component: Outlet,
});
