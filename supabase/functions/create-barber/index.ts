import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";
import { z } from "npm:zod@3.24.2";

const requestBuckets = new Map<string, { count: number; resetsAt: number }>();
const inviteSchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  title: z.string().trim().min(2).max(120).default("Barbeiro"),
  image: z.union([z.string().trim().url(), z.literal("")]).default(""),
  fixedFee: z.coerce.number().min(0).max(1000000).default(0),
});

Deno.serve(async (request) => {
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGIN") || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const requestOrigin = request.headers.get("Origin") || "";
  const originAllowed = !allowedOrigins.length || allowedOrigins.includes(requestOrigin);
  const corsHeaders = {
    "Access-Control-Allow-Origin": originAllowed ? requestOrigin : allowedOrigins[0] || "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405, corsHeaders);
  }

  if (!originAllowed) {
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
    if (!authHeader) {
      return json({ error: "Missing authorization header." }, 401, corsHeaders);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();

    if (callerError || callerData.user?.app_metadata?.role !== "owner") {
      return json({ error: "Only owner users can create barber access." }, 403, corsHeaders);
    }

    if (!consumeRequest(callerData.user.id)) {
      return json({ error: "Too many invitations. Try again in a few minutes." }, 429, corsHeaders);
    }

    const parsedBody = inviteSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return json({ error: "Invalid invitation data." }, 400, corsHeaders);
    }
    const { name, email, title, image, fixedFee } = parsedBody.data;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name,
        title,
        image,
      },
      redirectTo: `${Deno.env.get("APP_URL") || requestOrigin}/set-password`,
    });

    if (error) {
      return json({ error: error.message }, 400, corsHeaders);
    }

    const { error: roleError } = await adminClient.auth.admin.updateUserById(data.user.id, {
      app_metadata: { role: "barber" },
    });

    if (roleError) {
      await adminClient.auth.admin.deleteUser(data.user.id);
      return json({ error: "Unable to assign barber access." }, 500, corsHeaders);
    }

    await adminClient.from("customers").delete().eq("id", data.user.id);

    const barberId = crypto.randomUUID();
    const { error: barberError } = await adminClient.from("barbers").insert({
      id: barberId,
      name,
      title,
      image: image || null,
      rating: 5,
      revenue: 0,
      appts: 0,
      commission: 0,
      commission_rate: 0,
      fixed_fee: fixedFee,
      email,
      access_status: "pending",
      access_user_id: data.user.id,
      active: true,
    });

    if (barberError) {
      await adminClient.auth.admin.deleteUser(data.user.id);
      return json({ error: "Unable to create barber profile." }, 500, corsHeaders);
    }

    return json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: "barber",
        },
        barber: { id: barberId },
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      500,
      corsHeaders,
    );
  }
});

function json(body: unknown, status = 200, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function consumeRequest(userId: string) {
  const now = Date.now();
  const current = requestBuckets.get(userId);
  if (!current || current.resetsAt <= now) {
    requestBuckets.set(userId, { count: 1, resetsAt: now + 5 * 60_000 });
    return true;
  }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}
