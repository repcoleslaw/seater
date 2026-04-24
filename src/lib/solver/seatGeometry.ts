import type { Table } from "@/lib/solver/types";

export function getSeatDistance(table: Table, seatA: number, seatB: number): number {
  const diff = Math.abs(seatA - seatB);
  if (table.shape === "round") {
    return Math.min(diff, table.seats - diff);
  }
  return diff;
}

export function getPreferNearScore(weight: number, seatDistance: number): number {
  return Math.max(0, weight * (3 - Math.min(seatDistance, 3)));
}
