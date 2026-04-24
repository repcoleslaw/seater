import type { Constraint, Guest, Table } from "@/lib/solver/types";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

const normalizePairKey = (a: string, b: string): string =>
  a < b ? `${a}::${b}` : `${b}::${a}`;

function buildMustPairGroups(guests: Guest[], constraints: Constraint[]): string[][] {
  const adjacency = new Map<string, Set<string>>();
  for (const guest of guests) {
    adjacency.set(guest.id, new Set());
  }
  for (const constraint of constraints) {
    if (constraint.type !== "must_pair") {
      continue;
    }
    adjacency.get(constraint.guestAId)?.add(constraint.guestBId);
    adjacency.get(constraint.guestBId)?.add(constraint.guestAId);
  }

  const visited = new Set<string>();
  const groups: string[][] = [];
  for (const guest of guests) {
    if (visited.has(guest.id)) {
      continue;
    }
    const stack = [guest.id];
    const component: string[] = [];
    while (stack.length) {
      const current = stack.pop();
      if (!current || visited.has(current)) {
        continue;
      }
      visited.add(current);
      component.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
    groups.push(component);
  }

  return groups;
}

export function validatePlannerInput(
  guests: Guest[],
  tables: Table[],
  constraints: Constraint[],
): ValidationResult {
  const errors: string[] = [];

  if (!guests.length) {
    errors.push("Add at least one guest.");
  }

  if (!tables.length) {
    errors.push("Add at least one table.");
  }

  const totalSeats = tables.reduce((sum, table) => sum + table.seats, 0);
  if (totalSeats < guests.length) {
    errors.push("Total seats must be greater than or equal to guest count.");
  }

  const guestIdSet = new Set(guests.map((guest) => guest.id));
  for (const constraint of constraints) {
    if (
      !guestIdSet.has(constraint.guestAId) ||
      !guestIdSet.has(constraint.guestBId)
    ) {
      errors.push("Constraint references an unknown guest.");
    }

    if (constraint.guestAId === constraint.guestBId) {
      errors.push("Constraint cannot reference the same guest twice.");
    }
  }

  const mustPairs = new Set<string>();
  const cannotPairs = new Set<string>();
  for (const constraint of constraints) {
    const key = normalizePairKey(constraint.guestAId, constraint.guestBId);
    if (constraint.type === "must_pair") {
      mustPairs.add(key);
    }
    if (constraint.type === "cannot_pair") {
      cannotPairs.add(key);
    }
  }

  for (const key of mustPairs) {
    if (cannotPairs.has(key)) {
      errors.push("A pair cannot be both must-pair and cannot-pair.");
    }
  }

  const largestTableSeats = tables.reduce(
    (largest, table) => Math.max(largest, table.seats),
    0,
  );
  const mustPairGroups = buildMustPairGroups(guests, constraints);
  const oversizedGroup = mustPairGroups.find((group) => group.length > largestTableSeats);
  if (oversizedGroup) {
    errors.push(
      "At least one must-pair group is larger than every table capacity, so it cannot be satisfied.",
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
