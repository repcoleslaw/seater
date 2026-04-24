import { describe, expect, it } from "vitest";

import { generatePlan } from "@/lib/solver/generatePlan";
import type { Constraint, Guest, Table } from "@/lib/solver/types";

const guests: Guest[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
  { id: "c", name: "Cara" },
  { id: "d", name: "Dev" },
];

const tables: Table[] = [
  { id: "t1", label: "Table 1", seats: 2, shape: "round" },
  { id: "t2", label: "Table 2", seats: 2, shape: "round" },
];

describe("generatePlan", () => {
  it("does not exceed table capacities", () => {
    const constraints: Constraint[] = [];
    const plan = generatePlan(guests, tables, constraints, {
      seed: 12345,
      iterations: 100,
    });

    const tableCounts = new Map<string, number>();
    for (const assignment of plan.assignments) {
      tableCounts.set(
        assignment.tableId,
        (tableCounts.get(assignment.tableId) ?? 0) + 1,
      );
    }

    for (const table of tables) {
      expect(tableCounts.get(table.id) ?? 0).toBeLessThanOrEqual(table.seats);
    }
  });

  it("rewards satisfying must-pair constraints", () => {
    const constraints: Constraint[] = [
      {
        type: "must_pair",
        guestAId: "a",
        guestBId: "b",
        weight: 20,
      },
    ];

    const plan = generatePlan(guests, tables, constraints, {
      seed: 7,
      iterations: 300,
    });

    const byGuest = new Map(plan.assignments.map((entry) => [entry.guestId, entry]));
    expect(byGuest.get("a")?.tableId).toBe(byGuest.get("b")?.tableId);
    expect(
      plan.meta.violations.some((violation) => violation.type === "must_pair"),
    ).toBe(false);
  });
});
