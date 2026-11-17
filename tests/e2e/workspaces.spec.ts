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
  await captureWorkspaceTheme(page, testInfo, "owner-workspace");

  await page.goto("/owner/settings");
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Foto do proprietário" })).toBeVisible();
  await page.getByLabel("Nome da barbearia").fill("King's Barber Studio");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Configurações atualizadas.")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/owner/services");
  await expect(page.getByRole("heading", { name: /preço por barbeiro/i })).toBeVisible();
  await page.getByLabel(/Corte Signature com Miguel Reis/i).fill("92");
  await page.getByRole("button", { name: /salvar preços/i }).click();
  await expect(page.getByText(/preços por barbeiro atualizados/i)).toBeVisible();

  await page.goto("/owner/reports");
  await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
  await expect(page.getByText("Atendimentos concluídos", { exact: true })).toBeVisible();
});

test("owner can upload and preview a barber photo before saving", async ({ page }) => {
  await installAuthenticatedSupabase(page, "owner");
  await openAuthenticatedWorkspace(page, "/owner");
  await page.goto("/owner/employees");

  await page.getByRole("button", { name: "Adicionar barbeiro" }).click();
  await page.getByLabel("Nome").fill("Paulo Teste");
  await page.getByLabel("Escolher foto do celular").setInputFiles({
    name: "paulo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });

  await expect(page.getByRole("img", { name: "Prévia da foto de Paulo Teste" })).toBeVisible();
  await expect(page.getByLabel("Ou cole a URL da foto")).toHaveValue(/profile-images/);
  await expect(page.getByRole("button", { name: "Salvar" })).toBeEnabled();
});

test("barber workspace updates the live appointment state", async ({ page }, testInfo) => {
  await installAuthenticatedSupabase(page, "barber");
  await openAuthenticatedWorkspace(page, "/barber");

  await expect(page.getByRole("heading", { name: "Seu dia na cadeira" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await captureWorkspaceTheme(page, testInfo, "barber-workspace");

  await page.goto("/barber/schedule");
  await expect(page.getByRole("heading", { name: "Sua agenda" })).toBeVisible();
  await page.getByRole("button", { name: "Iniciar" }).first().click();
  await expect(page.getByText("Atendimento atualizado.")).toBeVisible();
  await expect(page.getByText("Em atendimento")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("public booking advances only after the customer clicks continue", async ({ page }) => {
  await installAuthenticatedSupabase(page, "client");
  await page.goto("/agendar");

  await expect(page.getByRole("heading", { name: "Escolha o serviço" })).toBeVisible();
  await page.getByRole("button", { name: /Corte Signature/ }).click();
  await expect(page.getByRole("heading", { name: "Escolha o serviço" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "Escolha o barbeiro" })).toBeVisible();
  await page.getByRole("button", { name: /Miguel Reis/ }).click();
  await expect(page.getByRole("heading", { name: "Escolha o barbeiro" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "Data e horário" })).toBeVisible();
  await page.getByRole("button", { name: "09:00" }).click();
  await expect(page.getByRole("heading", { name: "Data e horário" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Seus dados" })).toBeVisible();
});

test("client completes the booking flow and sees the resulting history", async ({
  page,
}, testInfo) => {
  await installAuthenticatedSupabase(page, "client");
  await openAuthenticatedWorkspace(page, "/");

  // O cliente volta para o site público, que destaca o próximo horário confirmado.
  await expect(page.getByText("Seu próximo horário")).toBeVisible();
  await expect(page.getByText("Corte Signature com Miguel Reis")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("client-home.png"), fullPage: true });

  await page.goto("/client/book");
  await expect(page.getByRole("heading", { name: "Agende seu horário" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("R$ 89")).toBeVisible();
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

async function captureWorkspaceTheme(page: Page, testInfo: TestInfo, stem: string) {
  const workspace = page.locator(".kb-workspace-bg");
  await expect(workspace).toBeVisible();
  await expect(workspace).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: /alterar tema/i })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath(`${stem}-black-gold.png`), fullPage: true });
}

async function openAuthenticatedWorkspace(page: Page, path: "/owner" | "/barber" | "/") {
  await page.goto("/login");
  await expect(page).toHaveURL(new RegExp(`${path === "/" ? "" : path}/?$`), { timeout: 15_000 });
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
