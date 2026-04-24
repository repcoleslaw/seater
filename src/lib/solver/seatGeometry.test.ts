import { describe, expect, it } from "vitest";

import { getSeatDistance } from "@/lib/solver/seatGeometry";
import type { Table } from "@/lib/solver/types";

describe("seatGeometry", () => {
  it("uses wrap-around distance for round tables", () => {
    const table: Table = { id: "t1", label: "Round", seats: 8, shape: "round" };
    expect(getSeatDistance(table, 1, 8)).toBe(1);
  });

  it("uses linear distance for rectangular tables", () => {
    const table: Table = { id: "t2", label: "Rect", seats: 8, shape: "rectangular" };
    expect(getSeatDistance(table, 1, 8)).toBe(7);
  });
});
