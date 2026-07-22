import { redirect } from "@tanstack/react-router";
import { AppRole, getRoleHome, getUserRole } from "@/features/auth/auth-context";
import { supabase } from "@/integrations/supabase/client";

export async function requireClientRole(role: AppRole, pathname: string) {
  if (typeof window === "undefined") return;
  if (!supabase) {
    throw redirect({ to: "/login", search: { redirect: pathname } });
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw redirect({ to: "/login", search: { redirect: pathname } });
  }

  const userRole = getUserRole(data.user);
  if (userRole !== role) {
    throw redirect({ to: getRoleHome(userRole) });
  }
}
