import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://mock.supabase.co/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/auth/v1/user") {
      await route.fulfill({ status: 401, json: { message: "Invalid JWT" } });
      return;
    }
    await route.fulfill({ status: 200, json: [] });
  });
  page.on("console", (message) => {
    if (message.type() === "error") console.error(`browser console: ${message.text()}`);
  });
  page.on("pageerror", (error) => console.error(`browser page error: ${error.message}`));
});

test("login and signup remain usable while the backend is unavailable", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Entrar na sua conta" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow-x", "hidden");

  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
  await expect(page.getByLabel("Nome")).toBeVisible();
  await expect(page.getByLabel("Telefone")).toBeVisible();
  await expect(page.getByLabel("Data de nascimento")).toBeVisible();
  await expect(page.getByLabel("Data de nascimento")).toHaveAttribute("required", "");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const dateWidth = document.getElementById("birthDate")?.getBoundingClientRect().width ?? 0;
        const emailWidth = document.getElementById("email")?.getBoundingClientRect().width ?? 0;
        return Math.abs(dateWidth - emailWidth) <= 1;
      }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test("opens login and signup in a popup without leaving the home page", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(page.locator("#servicos")).not.toContainText("R$");
  await expect(page.getByRole("heading", { name: "Escolha o barbeiro" })).toBeVisible();

  await page.getByRole("button", { name: "Entrar ou criar conta" }).click();
  await expect(page.getByRole("dialog", { name: "Entrar na conta" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Entrar na sua conta" })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await page.screenshot({ path: testInfo.outputPath("auth-popup.png"), fullPage: true });

  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Criar conta" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();

  await page.getByRole("button", { name: "Fechar acesso" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("routes owner and barber logins from the header popup to the correct workspace", async ({
  page,
}) => {
  let activeRole: "owner" | "barber" = "owner";
  await page.unroute("https://mock.supabase.co/**");
  await page.route("https://mock.supabase.co/**", async (route) => {
    const url = new URL(route.request().url());
    const user = mockTeamUser(activeRole);

    if (url.pathname === "/auth/v1/token") {
      await route.fulfill({
        status: 200,
        json: {
          access_token: `${activeRole}-access-token`,
          refresh_token: `${activeRole}-refresh-token`,
          expires_in: 3600,
          token_type: "bearer",
          user,
        },
      });
      return;
    }
    if (url.pathname === "/auth/v1/user") {
      await route.fulfill({ status: 200, json: user });
      return;
    }
    await route.fulfill({ status: 200, json: [] });
  });

  for (const account of [
    { role: "owner" as const, path: "/owner", heading: "Visão geral da barbearia" },
    { role: "barber" as const, path: "/barber", heading: "Seu dia na cadeira" },
  ]) {
    activeRole = account.role;
    await page.goto("/");
    await page.getByRole("button", { name: "Entrar ou criar conta" }).click();
    await page.getByLabel("E-mail").fill(`${account.role}@kingsbarber.test`);
    await page.getByLabel("Senha", { exact: true }).fill("Senha-segura-123!");
    await page.locator("form").getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`${account.path}/?$`));
    await expect(page.getByRole("heading", { name: account.heading })).toBeVisible();

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
});

test("theme choice is persisted", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /alterar tema/i }).click();
  await page.getByRole("menuitemradio", { name: /tema claro/i }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("kings-barber-theme")))
    .toBe("light");
});

test("protected workspaces redirect unauthenticated visitors", async ({ page }) => {
  await page.goto("/owner");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fowner/);
  await expect(page.getByRole("heading", { name: "Entrar na sua conta" })).toBeVisible();
});

test("captures the responsive login reference", async ({ page }, testInfo) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /alterar tema/i })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("login-light-reference.png"), fullPage: true });
  await page.getByRole("button", { name: /alterar tema/i }).click();
  const darkOption = page.getByRole("menuitemradio", { name: /tema escuro/i });
  await darkOption.click();
  await expect(darkOption).toBeHidden();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: testInfo.outputPath("login-dark-reference.png"), fullPage: true });
});

function mockTeamUser(role: "owner" | "barber") {
  return {
    id: `${role}-user`,
    aud: "authenticated",
    role: "authenticated",
    email: `${role}@kingsbarber.test`,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"], role },
    user_metadata: { full_name: role === "owner" ? "Henrique Andrade" : "Miguel Reis" },
    identities: [],
    created_at: new Date().toISOString(),
  };
}
