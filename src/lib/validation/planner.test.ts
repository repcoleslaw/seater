import { describe, expect, it } from "vitest";

import type { Constraint, Guest, Table } from "@/lib/solver/types";
import { validatePlannerInput } from "@/lib/validation/planner";

describe("validatePlannerInput", () => {
  it("fails when capacity is too low", () => {
    const guests: Guest[] = [
      { id: "a", name: "Alice" },
      { id: "b", name: "Bob" },
    ];
    const tables: Table[] = [{ id: "t1", label: "Table 1", seats: 1, shape: "round" }];
    const constraints: Constraint[] = [];

    const result = validatePlannerInput(guests, tables, constraints);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "Total seats must be greater than or equal to guest count.",
    );
  });

  it("fails when pair is both must and cannot", () => {
    const guests: Guest[] = [
      { id: "a", name: "Alice" },
      { id: "b", name: "Bob" },
    ];
    const tables: Table[] = [{ id: "t1", label: "Table 1", seats: 2, shape: "round" }];
    const constraints: Constraint[] = [
      { type: "must_pair", guestAId: "a", guestBId: "b", weight: 10 },
      { type: "cannot_pair", guestAId: "b", guestBId: "a", weight: 10 },
    ];

    const result = validatePlannerInput(guests, tables, constraints);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "A pair cannot be both must-pair and cannot-pair.",
    );
  });

  it("fails when a must-pair group cannot fit any table", () => {
    const guests: Guest[] = [
      { id: "a", name: "Alice" },
      { id: "b", name: "Bob" },
      { id: "c", name: "Cara" },
    ];
    const tables: Table[] = [{ id: "t1", label: "Table 1", seats: 2, shape: "round" }];
    const constraints: Constraint[] = [
      { type: "must_pair", guestAId: "a", guestBId: "b", weight: 10 },
      { type: "must_pair", guestAId: "b", guestBId: "c", weight: 10 },
    ];

    const result = validatePlannerInput(guests, tables, constraints);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "At least one must-pair group is larger than every table capacity, so it cannot be satisfied.",
    );
  });
});
