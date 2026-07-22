import { describe, expect, it } from "vitest";
import { serializeCsv } from "./csv";

describe("CSV export", () => {
  it("escapes quotes and neutralizes spreadsheet formulas", () => {
    const csv = serializeCsv([{ cliente: '=HYPERLINK("bad")', valor: 120 }]);

    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"120"');
  });

  it("returns an empty string for an empty report", () => {
    expect(serializeCsv([])).toBe("");
  });
});
