import { describe, expect, it } from "vitest";
import { isStrongPassword } from "./password";

describe("isStrongPassword", () => {
  it("accepts a password that meets every requirement", () => {
    expect(isStrongPassword("Barbearia#2026")).toBe(true);
  });

  it.each([
    "Curta#1",
    "semmaiuscula#2026",
    "SEMMINUSCULA#2026",
    "SemNumero#Senha",
    "SemSimbolo2026",
  ])("rejects weak password %s", (password) => {
    expect(isStrongPassword(password)).toBe(false);
  });
});
