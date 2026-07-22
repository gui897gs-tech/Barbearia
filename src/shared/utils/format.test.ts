import { describe, expect, it } from "vitest";
import { formatCurrency, isCancelledStatus, isCompletedStatus } from "./format";

describe("format helpers", () => {
  it("formats BRL consistently", () => {
    expect(formatCurrency(120)).toMatch(/R\$\s?120/);
  });

  it("recognizes normalized appointment statuses", () => {
    expect(isCompletedStatus("Concluído")).toBe(true);
    expect(isCancelledStatus("Cancelado pelo cliente")).toBe(true);
    expect(isCancelledStatus("Confirmado")).toBe(false);
  });
});
