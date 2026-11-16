import { describe, expect, it } from "vitest";
import { getOpenStatus, whatsappUrl } from "./brand";

// Datas em UTC; São Paulo está em UTC-3.
describe("getOpenStatus", () => {
  it("reports open during business hours", () => {
    const status = getOpenStatus(new Date("2026-11-16T15:00:00Z")); // segunda, 12h
    expect(status.open).toBe(true);
    expect(status.detail).toBe("Fecha às 19h");
  });

  it("reports when it opens later the same day", () => {
    const status = getOpenStatus(new Date("2026-11-16T10:00:00Z")); // segunda, 07h
    expect(status.open).toBe(false);
    expect(status.detail).toBe("Abre hoje às 09h");
  });

  it("skips closed sundays", () => {
    const status = getOpenStatus(new Date("2026-11-15T15:00:00Z")); // domingo, 12h
    expect(status.open).toBe(false);
    expect(status.detail).toBe("Abre amanhã às 09h");
  });

  it("points to monday after saturday closing", () => {
    const status = getOpenStatus(new Date("2026-11-14T23:30:00Z")); // sábado, 20h30
    expect(status.detail).toBe("Abre segunda às 09h");
  });
});

describe("whatsappUrl", () => {
  it("encodes the message", () => {
    expect(whatsappUrl("Olá, tudo bem?")).toMatch(
      /^https:\/\/wa\.me\/\d+\?text=Ol%C3%A1%2C%20tudo%20bem%3F$/,
    );
  });
});
