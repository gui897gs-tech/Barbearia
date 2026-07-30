import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { installAuthenticatedSupabase } from "./support/mock-supabase";

test.beforeEach(async ({ page }) => {
  page.on("console", (message) => {
    if (message.type() === "error") console.error(`browser console: ${message.text()}`);
  });
  page.on("pageerror", (error) => console.error(`browser page error: ${error.message}`));
});

test("owner workspace loads, persists settings and remains responsive", async ({
  page,
}, testInfo) => {
  await installAuthenticatedSupabase(page, "owner");
  await openAuthenticatedWorkspace(page, "/owner");

  await expect(page.getByRole("heading", { name: "Visão geral da barbearia" })).toBeVisible();
  await expect(page.getByText("R$ 55").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await captureBothThemes(page, testInfo, "owner-workspace");

  await page.goto("/owner/settings");
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  await page.getByLabel("Nome da barbearia").fill("King's Barber Studio");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Configurações atualizadas.")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/owner/reports");
  await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
  await expect(page.getByText("Atendimentos concluídos", { exact: true })).toBeVisible();
});

test("barber workspace updates the live appointment state", async ({ page }, testInfo) => {
  await installAuthenticatedSupabase(page, "barber");
  await openAuthenticatedWorkspace(page, "/barber");

  await expect(page.getByRole("heading", { name: "Seu dia na cadeira" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await captureBothThemes(page, testInfo, "barber-workspace");

  await page.goto("/barber/schedule");
  await expect(page.getByRole("heading", { name: "Sua agenda" })).toBeVisible();
  await page.getByRole("button", { name: "Iniciar" }).first().click();
  await expect(page.getByText("Atendimento atualizado.")).toBeVisible();
  await expect(page.getByText("Em atendimento")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("client completes the booking flow and sees the resulting history", async ({
  page,
}, testInfo) => {
  await installAuthenticatedSupabase(page, "client");
  await openAuthenticatedWorkspace(page, "/client");

  await expect(page.getByRole("heading", { name: "Seu próximo corte começa aqui." })).toBeVisible();
  await expect(page.getByText("Corte Signature com Miguel Reis")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await captureBothThemes(page, testInfo, "client-workspace");

  await page.goto("/client/book");
  await expect(page.getByRole("heading", { name: "Agende seu horário" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Selecione um serviço" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Escolha uma data" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Escolha um horário" })).toBeVisible();
  await expect(page.getByRole("button", { name: "09:00" })).toBeEnabled();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Confirme seu agendamento" })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();

  await expect(page).toHaveURL(/\/client\/history/);
  await expect(page.getByRole("heading", { name: "Histórico de agendamentos" })).toBeVisible();
  await expect(page.getByText("Agendamento confirmado.")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/client/products");
  await expect(page.getByRole("heading", { name: "Produtos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pomada Modeladora" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gel de Cabelo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Laquê" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

async function captureBothThemes(page: Page, testInfo: TestInfo, stem: string) {
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.screenshot({ path: testInfo.outputPath(`${stem}-light.png`), fullPage: true });
  await page.getByRole("button", { name: /alterar tema/i }).click();
  const darkOption = page.getByRole("menuitem", { name: /tema escuro/i });
  await darkOption.click();
  await expect(darkOption).toBeHidden();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: testInfo.outputPath(`${stem}-dark.png`), fullPage: true });
}

async function openAuthenticatedWorkspace(page: Page, path: "/owner" | "/barber" | "/client") {
  await page.goto("/login");
  await expect(page).toHaveURL(new RegExp(`${path}/?$`), { timeout: 15_000 });
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
}
