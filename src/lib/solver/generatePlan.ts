import type {
  Assignment,
  Constraint,
  GeneratedPlan,
  Guest,
  Table,
  Violation,
} from "@/lib/solver/types";
import { getPreferNearScore, getSeatDistance } from "@/lib/solver/seatGeometry";

type PairIndex = {
  mustPairs: Map<string, number>;
  cannotPairs: Map<string, number>;
  preferNearPairs: Map<string, number>;
};

type GeneratedCandidate = {
  assignments: Assignment[];
  score: number;
  violations: Violation[];
};

type GenerateOptions = {
  seed?: number;
  iterations?: number;
};

const DEFAULT_ITERATIONS = 300;

const normalizePairKey = (a: string, b: string): string =>
  a < b ? `${a}::${b}` : `${b}::${a}`;

const makeRandom = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

function buildPairIndex(constraints: Constraint[]): PairIndex {
  const mustPairs = new Map<string, number>();
  const cannotPairs = new Map<string, number>();
  const preferNearPairs = new Map<string, number>();

  for (const constraint of constraints) {
    const key = normalizePairKey(constraint.guestAId, constraint.guestBId);
    if (constraint.type === "must_pair") {
      mustPairs.set(key, constraint.weight);
    } else if (constraint.type === "cannot_pair") {
      cannotPairs.set(key, constraint.weight);
    } else {
      preferNearPairs.set(key, constraint.weight);
    }
  }

  return { mustPairs, cannotPairs, preferNearPairs };
}

function evaluateCandidate(
  assignments: Assignment[],
  pairIndex: PairIndex,
  tableById: Map<string, Table>,
): { score: number; violations: Violation[] } {
  const byGuest = new Map(assignments.map((assignment) => [assignment.guestId, assignment]));

  let score = 0;
  const violations: Violation[] = [];
  const allPairWeights = [
    ...pairIndex.mustPairs.entries().map(([key, weight]) => ({ key, weight, type: "must_pair" as const })),
    ...pairIndex.cannotPairs.entries().map(([key, weight]) => ({ key, weight, type: "cannot_pair" as const })),
    ...pairIndex.preferNearPairs.entries().map(([key, weight]) => ({ key, weight, type: "prefer_near" as const })),
  ];

  for (const pair of allPairWeights) {
    const [a, b] = pair.key.split("::");
    const first = byGuest.get(a);
    const second = byGuest.get(b);
    if (!first || !second) {
      continue;
    }
    const sameTable = first.tableId === second.tableId;
    const table = tableById.get(first.tableId);
    const seatDistance =
      sameTable && table
        ? getSeatDistance(table, first.seatIndex, second.seatIndex)
        : Number.POSITIVE_INFINITY;

    if (pair.type === "must_pair") {
      if (sameTable) {
        score += pair.weight * 6;
        if (seatDistance <= 1) {
          score += pair.weight * 2;
        }
      } else {
        score -= pair.weight * 10;
        violations.push({
          type: "must_pair",
          guestIds: [a, b],
          tableId: null,
          message: `Must pair violated: ${a} and ${b} are seated at different tables.`,
        });
      }
    }

    if (pair.type === "cannot_pair") {
      if (sameTable) {
        score -= pair.weight * 12;
        violations.push({
          type: "cannot_pair",
          guestIds: [a, b],
          tableId: first.tableId,
          message: `Cannot pair violated: ${a} and ${b} are seated together.`,
        });
      } else {
        score += pair.weight * 4;
      }
    }

    if (pair.type === "prefer_near") {
      if (sameTable) {
        score += getPreferNearScore(pair.weight, seatDistance);
      } else {
        score -= pair.weight;
      }
    }
  }

  return { score, violations };
}

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

function buildRandomCandidate(
  guests: Guest[],
  tables: Table[],
  random: () => number,
  constraints: Constraint[],
  pairIndex: PairIndex,
): GeneratedCandidate {
  const shuffledGuests = [...guests];
  for (let i = shuffledGuests.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffledGuests[i], shuffledGuests[j]] = [shuffledGuests[j], shuffledGuests[i]];
  }

  const seatsByTable = new Map<string, number[]>();
  for (const table of tables) {
    const seatIndexes: number[] = [];
    for (let seat = 1; seat <= table.seats; seat += 1) {
      seatIndexes.push(seat);
    }
    for (let i = seatIndexes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [seatIndexes[i], seatIndexes[j]] = [seatIndexes[j], seatIndexes[i]];
    }
    seatsByTable.set(table.id, seatIndexes);
  }

  const assignments: Assignment[] = [];
  const tableById = new Map(tables.map((table) => [table.id, table]));
  const tableOrder = [...tables];
  for (let i = tableOrder.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [tableOrder[i], tableOrder[j]] = [tableOrder[j], tableOrder[i]];
  }
  const mustPairGroups = buildMustPairGroups(shuffledGuests, constraints);
  const groupedGuests = mustPairGroups
    .map((group) => [...group])
    .sort((a, b) => b.length - a.length);

  for (const group of groupedGuests) {
    const eligibleTables = tableOrder.filter(
      (table) => (seatsByTable.get(table.id)?.length ?? 0) >= group.length,
    );
    if (!eligibleTables.length) {
      return {
        assignments: [],
        score: Number.NEGATIVE_INFINITY,
        violations: [
          {
            type: "must_pair",
            guestIds: [group[0], group[group.length - 1]],
            tableId: null,
            message: "Must pair group cannot fit at any table.",
          },
        ],
      };
    }
    const selectedTable =
      eligibleTables.length === 1
        ? eligibleTables[0]
        : eligibleTables.reduce((bestTable, candidateTable) => {
            const currentRemaining = seatsByTable.get(candidateTable.id)?.length ?? 0;
            const bestRemaining = seatsByTable.get(bestTable.id)?.length ?? 0;
            const currentScore = currentRemaining - candidateTable.seats;
            const bestScore = bestRemaining - bestTable.seats;
            return currentScore > bestScore ? candidateTable : bestTable;
          });
    const seatIndexes = seatsByTable.get(selectedTable.id) ?? [];
    const randomGuestOrder = [...group];
    for (let i = randomGuestOrder.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [randomGuestOrder[i], randomGuestOrder[j]] = [randomGuestOrder[j], randomGuestOrder[i]];
    }
    for (const guestId of randomGuestOrder) {
      let bestSeatIndex = -1;
      let bestSeatScore = Number.NEGATIVE_INFINITY;
      for (const candidateSeat of seatIndexes) {
        let candidateScore = 0;
        for (const existing of assignments) {
          const key = normalizePairKey(guestId, existing.guestId);
          const table = tableById.get(selectedTable.id);
          const sameTable = existing.tableId === selectedTable.id;
          const seatDistance =
            sameTable && table
              ? getSeatDistance(table, candidateSeat, existing.seatIndex)
              : Number.POSITIVE_INFINITY;
          const mustWeight = pairIndex.mustPairs.get(key);
          if (mustWeight) {
            candidateScore += sameTable ? mustWeight * 6 : -mustWeight * 10;
            if (sameTable && seatDistance <= 1) {
              candidateScore += mustWeight * 2;
            }
          }
          const cannotWeight = pairIndex.cannotPairs.get(key);
          if (cannotWeight) {
            candidateScore += sameTable ? -cannotWeight * 12 : cannotWeight * 4;
          }
          const preferNearWeight = pairIndex.preferNearPairs.get(key);
          if (preferNearWeight) {
            candidateScore += sameTable
              ? getPreferNearScore(preferNearWeight, seatDistance)
              : -preferNearWeight;
          }
        }
        if (candidateScore > bestSeatScore) {
          bestSeatScore = candidateScore;
          bestSeatIndex = candidateSeat;
        }
      }
      if (bestSeatIndex === -1) {
        return {
          assignments: [],
          score: Number.NEGATIVE_INFINITY,
          violations: [
            {
              type: "must_pair",
              guestIds: [group[0], group[group.length - 1]],
              tableId: selectedTable.id,
              message: "Unexpected seat assignment failure in must-pair placement.",
            },
          ],
        };
      }
      const chosenSeatOffset = seatIndexes.indexOf(bestSeatIndex);
      seatIndexes.splice(chosenSeatOffset, 1);
      assignments.push({
        guestId,
        tableId: selectedTable.id,
        seatIndex: bestSeatIndex,
      });
    }
  }

  const { score, violations } = evaluateCandidate(assignments, pairIndex, tableById);
  return { assignments, score, violations };
}

function calculateMaxScoreReference(constraints: Constraint[]): number {
  let maxScore = 0;
  for (const constraint of constraints) {
    if (constraint.type === "must_pair") {
      maxScore += constraint.weight * 8;
    } else if (constraint.type === "cannot_pair") {
      maxScore += constraint.weight * 4;
    } else {
      maxScore += constraint.weight * 2;
    }
  }
  return maxScore;
}

export function generatePlan(
  guests: Guest[],
  tables: Table[],
  constraints: Constraint[],
  options: GenerateOptions = {},
): GeneratedPlan {
  const seed = options.seed ?? Math.floor(Math.random() * 1_000_000_000);
  const iterations = options.iterations ?? DEFAULT_ITERATIONS;
  const random = makeRandom(seed);
  const pairIndex = buildPairIndex(constraints);

  let best = buildRandomCandidate(guests, tables, random, constraints, pairIndex);
  for (let i = 1; i < iterations; i += 1) {
    const candidate = buildRandomCandidate(guests, tables, random, constraints, pairIndex);
    if (candidate.score > best.score) {
      best = candidate;
    }
  }

  return {
    assignments: best.assignments,
    meta: {
      seed,
      score: best.score,
      maxScoreReference: calculateMaxScoreReference(constraints),
      violations: best.violations,
    },
  };
}
