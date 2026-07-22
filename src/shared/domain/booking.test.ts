import { describe, expect, it } from "vitest";
import { buildTimeSlots, filterAvailableSlots, timeToMinutes } from "./booking";

describe("booking availability", () => {
  it("builds half-hour slots inside business hours", () => {
    expect(buildTimeSlots("09:00", "10:30")).toEqual(["09:00", "09:30", "10:00"]);
  });

  it("blocks partial overlaps for services with different durations", () => {
    const available = filterAvailableSlots({
      candidates: buildTimeSlots("09:00", "12:00"),
      requestedDuration: 60,
      closeTime: "12:00",
      occupied: [{ time: "10:00", durationMinutes: 60 }],
    });

    expect(available).toEqual(["09:00", "11:00"]);
  });

  it("allows adjacent appointments and rejects slots past closing", () => {
    const available = filterAvailableSlots({
      candidates: ["17:30", "18:00", "18:30"],
      requestedDuration: 60,
      closeTime: "19:00",
      occupied: [{ time: "17:00", durationMinutes: 30 }],
    });

    expect(available).toEqual(["17:30", "18:00"]);
  });

  it("rejects malformed times", () => {
    expect(() => timeToMinutes("25:00")).toThrow("Horário inválido");
  });
});
