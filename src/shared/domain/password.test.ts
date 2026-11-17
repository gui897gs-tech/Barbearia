import { describe, expect, it } from "vitest";
import { isStrongPassword } from "./password";

describe("isStrongPassword", () => {
  it("accepts any password with at least eight characters", () => {
    expect(isStrongPassword("12345678")).toBe(true);
  });

  it("rejects a password shorter than eight characters", () => {
    expect(isStrongPassword("1234567")).toBe(false);
  });
});
