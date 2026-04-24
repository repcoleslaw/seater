import { describe, expect, it } from "vitest";

import { buildAssignmentsCsv, parseGuestCsv } from "@/lib/csv/plannerCsv";
import type { Assignment, Guest, Table } from "@/lib/solver/types";

describe("plannerCsv", () => {
  it("parses guest names from the name column", () => {
    const input = ["name,email", "Alice,alice@example.com", "Bob,bob@example.com"].join(
      "\n",
    );
    expect(parseGuestCsv(input)).toEqual(["Alice", "Bob"]);
  });

  it("builds deterministic output sorted by table then seat", () => {
    const guests: Guest[] = [
      { id: "a", name: "Alice" },
      { id: "b", name: "Bob" },
    ];
    const tables: Table[] = [
      { id: "t2", label: "Zeta", seats: 2, shape: "round" },
      { id: "t1", label: "Alpha", seats: 2, shape: "round" },
    ];
    const assignments: Assignment[] = [
      { guestId: "a", tableId: "t2", seatIndex: 2 },
      { guestId: "b", tableId: "t1", seatIndex: 1 },
    ];

    const csv = buildAssignmentsCsv(assignments, guests, tables).split("\n");
    expect(csv[0]).toBe("guest_name,table_label,seat_index");
    expect(csv[1]).toBe("Bob,Alpha,1");
    expect(csv[2]).toBe("Alice,Zeta,2");
  });
});
