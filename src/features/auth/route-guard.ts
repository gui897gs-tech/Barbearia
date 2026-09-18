import { redirect } from "@tanstack/react-router";
import { AppRole, getRoleHome, getUserRole } from "@/features/auth/auth-context";
import { supabase } from "@/integrations/supabase/client";

export async function requireClientRole(role: AppRole, pathname: string) {
  if (typeof window === "undefined") return;
  if (!supabase) {
    throw redirect({ to: "/login", search: { redirect: pathname } });
  }

  // Route guards are a client-side UX layer. Reading the persisted session avoids
  // a network round-trip on every navigation; PostgreSQL RLS remains authoritative.
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) {
    throw redirect({ to: "/login", search: { redirect: pathname } });
  }

  const userRole = getUserRole(data.session.user);
  if (userRole !== role) {
    throw redirect({ to: getRoleHome(userRole) });
  }
}
