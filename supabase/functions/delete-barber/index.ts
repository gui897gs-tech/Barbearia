import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";
import { z } from "npm:zod@3.24.2";

const deleteSchema = z.object({ barberId: z.string().min(1).max(100) });

Deno.serve(async (request) => {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "";
  const requestOrigin = request.headers.get("Origin") || "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };

  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, corsHeaders);
  if (allowedOrigin && requestOrigin !== allowedOrigin) {
    return json({ error: "Origin not allowed." }, 403, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Supabase environment variables are missing." }, 500, corsHeaders);
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization header." }, 401, corsHeaders);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || callerData.user?.app_metadata?.role !== "owner") {
      return json({ error: "Only owner users can revoke barber access." }, 403, corsHeaders);
    }

    const parsedBody = deleteSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return json({ error: "A valid barber id is required." }, 400, corsHeaders);
    }
    const { barberId } = parsedBody.data;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: barber, error: lookupError } = await adminClient
      .from("barbers")
      .select("access_user_id")
      .eq("id", barberId)
      .maybeSingle();
    if (lookupError || !barber) return json({ error: "Barber not found." }, 404, corsHeaders);

    if (barber.access_user_id) {
      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
        barber.access_user_id,
      );
      if (deleteUserError) {
        return json({ error: "Unable to revoke the user account." }, 500, corsHeaders);
      }
    }

    const { error: deleteProfileError } = await adminClient
      .from("barbers")
      .delete()
      .eq("id", barberId);
    if (deleteProfileError) {
      return json({ error: "Unable to delete the barber profile." }, 500, corsHeaders);
    }

    return json({ success: true }, 200, corsHeaders);
  } catch {
    return json({ error: "Unexpected error." }, 500, corsHeaders);
  }
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
