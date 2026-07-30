import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.REAL_SUPABASE_URL;
const anonKey = process.env.REAL_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.REAL_SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.REAL_APP_URL ?? "https://kings-barber-management-eight.vercel.app";

test("barber invite never changes the password or role of an active owner session", async ({
  page,
}) => {
  test.skip(
    !supabaseUrl || !anonKey || !serviceRoleKey,
    "Credenciais reais são necessárias para este teste isolado.",
  );

  const admin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const publicClient = createClient(supabaseUrl!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const suffix = crypto.randomUUID();
  const ownerEmail = `owner-conflict-${suffix}@example.com`;
  const barberEmail = `barber-conflict-${suffix}@example.com`;
  const ownerPassword = `Owner-${crypto.randomUUID()}!`;
  const barberPassword = `Barber-${crypto.randomUUID()}!`;
  let ownerId: string | undefined;
  let barberId: string | undefined;

  try {
    const ownerResult = await admin.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      app_metadata: { role: "owner" },
      user_metadata: { full_name: "Proprietário de teste" },
    });
    expect(ownerResult.error).toBeNull();
    ownerId = ownerResult.data.user?.id;

    const inviteResult = await admin.auth.admin.generateLink({
      type: "invite",
      email: barberEmail,
      options: {
        redirectTo: `${appUrl}/set-password`,
        data: { full_name: "Barbeiro de teste" },
      },
    });
    expect(inviteResult.error).toBeNull();
    expect(inviteResult.data.properties?.action_link).toBeTruthy();
    barberId = inviteResult.data.user?.id;

    const roleResult = await admin.auth.admin.updateUserById(barberId!, {
      app_metadata: { role: "barber" },
    });
    expect(roleResult.error).toBeNull();

    await page.goto(`${appUrl}/login`);
    await page.getByLabel("E-mail").fill(ownerEmail);
    await page.getByLabel("Senha").fill(ownerPassword);
    await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/owner\/?$/, { timeout: 15_000 });

    await page.goto(inviteResult.data.properties!.action_link);
    await expect(page).toHaveURL(/\/set-password/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Defina sua senha" })).toBeVisible();
    await page.getByLabel("Nova senha").fill(barberPassword);
    await page.getByLabel("Confirmar senha").fill(barberPassword);
    await page.getByRole("button", { name: "Salvar senha e acessar" }).click();
    await expect(page).toHaveURL(/\/barber\/?$/, { timeout: 15_000 });

    const ownerLogin = await publicClient.auth.signInWithPassword({
      email: ownerEmail,
      password: ownerPassword,
    });
    expect(ownerLogin.error).toBeNull();
    expect(ownerLogin.data.user?.app_metadata.role).toBe("owner");
    await publicClient.auth.signOut();

    const barberLogin = await publicClient.auth.signInWithPassword({
      email: barberEmail,
      password: barberPassword,
    });
    expect(barberLogin.error).toBeNull();
    expect(barberLogin.data.user?.app_metadata.role).toBe("barber");
  } finally {
    if (barberId) await admin.auth.admin.deleteUser(barberId);
    if (ownerId) await admin.auth.admin.deleteUser(ownerId);
  }
});
