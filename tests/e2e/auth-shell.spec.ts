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

  await expect(page.getByRole("heading", { name: "Entre na sua barbearia" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow-x", "hidden");

  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
  await expect(page.getByLabel("Nome")).toBeVisible();
  await expect(page.getByLabel("Telefone")).toBeVisible();
});

test("theme choice is persisted", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /alterar tema/i }).click();
  await page.getByRole("menuitem", { name: /tema claro/i }).click();
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
  await expect(page.getByRole("heading", { name: "Entre na sua barbearia" })).toBeVisible();
});

test("captures the responsive login reference", async ({ page }, testInfo) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /alterar tema/i })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("login-light-reference.png"), fullPage: true });
  await page.getByRole("button", { name: /alterar tema/i }).click();
  const darkOption = page.getByRole("menuitem", { name: /tema escuro/i });
  await darkOption.click();
  await expect(darkOption).toBeHidden();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: testInfo.outputPath("login-dark-reference.png"), fullPage: true });
});
