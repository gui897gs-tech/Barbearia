import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase environment variables are missing." }, 500);
    }

    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (fullName.length < 3) {
      return json({ error: "Informe seu nome completo." }, 400);
    }

    if (phone.replace(/\D/g, "").length < 10) {
      return json({ error: "Informe um telefone valido." }, 400);
    }

    if (!email.includes("@") || !email.includes(".")) {
      return json({ error: "Informe um e-mail valido." }, 400);
    }

    if (password.length < 8) {
      return json({ error: "Use uma senha com pelo menos 8 caracteres." }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        role: "client",
      },
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    return json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata.role,
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
