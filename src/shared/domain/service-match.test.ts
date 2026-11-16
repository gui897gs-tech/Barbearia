import { describe, expect, it } from "vitest";
import { findServiceByName } from "./service-match";

const services = [
  { id: "1", name: "Corte masculino" },
  { id: "2", name: "Corte + barba" },
  { id: "3", name: "Nevou / Platinado" },
];

describe("findServiceByName", () => {
  it("matches ignoring accents, case and punctuation", () => {
    expect(findServiceByName(services, "corte + BARBA")?.id).toBe("2");
    expect(findServiceByName(services, "nevou platinado")?.id).toBe("3");
  });

  it("falls back to partial matches", () => {
    expect(findServiceByName(services, "Corte masculino degradê")?.id).toBe("1");
  });

  it("returns undefined for unknown or empty names", () => {
    expect(findServiceByName(services, "Massagem")).toBeUndefined();
    expect(findServiceByName(services, "  ")).toBeUndefined();
  });
});
