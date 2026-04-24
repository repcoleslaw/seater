"use client";
import type { Constraint, Guest } from "@/lib/solver/types";
import { useMemo, useState } from "react";

type ConstraintsRulesSectionProps = {
  guests: Guest[];
  constraints: Constraint[];
  constraintType: Constraint["type"];
  constraintA: string;
  constraintB: string;
  constraintWeight: number;
  onConstraintTypeChange: (value: Constraint["type"]) => void;
  onConstraintAChange: (value: string) => void;
  onConstraintBChange: (value: string) => void;
  onConstraintWeightChange: (value: number) => void;
  onAddConstraint: () => void;
  onUpdateConstraint: (
    index: number,
    patch: Partial<Pick<Constraint, "type" | "guestAId" | "guestBId" | "weight">>,
  ) => void;
  onDeleteConstraint: (index: number) => void;
};

export function ConstraintsRulesSection({
  guests,
  constraints,
  constraintType,
  constraintA,
  constraintB,
  constraintWeight,
  onConstraintTypeChange,
  onConstraintAChange,
  onConstraintBChange,
  onConstraintWeightChange,
  onAddConstraint,
  onUpdateConstraint,
  onDeleteConstraint,
}: ConstraintsRulesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const guestNameById = useMemo(
    () => new Map(guests.map((guest) => [guest.id, guest.name])),
    [guests],
  );

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredConstraints = useMemo(() => {
    if (!normalizedSearchTerm) {
      return constraints.map((constraint, originalIndex) => ({
        constraint,
        originalIndex,
      }));
    }

    return constraints
      .map((constraint, originalIndex) => ({ constraint, originalIndex }))
      .filter(({ constraint }) => {
        const typeLabel = constraint.type.replaceAll("_", " ");
        const guestAName = guestNameById.get(constraint.guestAId) ?? "";
        const guestBName = guestNameById.get(constraint.guestBId) ?? "";
        const searchable = `${typeLabel} ${guestAName} ${guestBName}`.toLowerCase();
        return searchable.includes(normalizedSearchTerm);
      });
  }, [constraints, guestNameById, normalizedSearchTerm]);

  const hasNoMatches = constraints.length > 0 && filteredConstraints.length === 0;

  return (
    <section className="gap-3 rounded border p-4">
      <h2 className="text-xl font-semibold">2) Constraints</h2>
      <div className="grid gap-2 md:grid-cols-5">
        <select
          className="rounded border px-2 py-2"
          value={constraintType}
          onChange={(event) => onConstraintTypeChange(event.target.value as Constraint["type"])}
        >
          <option value="must_pair">Must Pair</option>
          <option value="cannot_pair">Cannot Pair</option>
          <option value="prefer_near">Prefer Near</option>
        </select>
        <select
          className="rounded border px-2 py-2"
          value={constraintA}
          onChange={(event) => onConstraintAChange(event.target.value)}
        >
          <option value="">Guest A</option>
          {guests.map((guest) => (
            <option key={guest.id} value={guest.id}>
              {guest.name}
            </option>
          ))}
        </select>
        <select
          className="rounded border px-2 py-2"
          value={constraintB}
          onChange={(event) => onConstraintBChange(event.target.value)}
        >
          <option value="">Guest B</option>
          {guests.map((guest) => (
            <option key={guest.id} value={guest.id}>
              {guest.name}
            </option>
          ))}
        </select>
        <input
          className="rounded border px-2 py-2"
          type="number"
          min={1}
          max={20}
          value={constraintWeight}
          onChange={(event) => onConstraintWeightChange(Number(event.target.value))}
        />
        <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={onAddConstraint}>
          Add Constraint
        </button>
      </div>
      {/* Constraints List */}
      <div className="grid gap-2 text-sm">
        <div className="flex flex-col gap-2 rounded border border-zinc-200 p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">Defined constraints ({constraints.length})</p>
            <button
              className="rounded border border-zinc-300 px-3 py-1"
              onClick={() => setIsExpanded((previous) => !previous)}
              type="button"
            >
              {isExpanded ? "Hide" : "Show"} ({constraints.length})
            </button>
          </div>
          {isExpanded && (
            <>
              <input
                className="rounded border px-2 py-2"
                placeholder="Search pair or rule..."
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              {filteredConstraints.map(({ constraint, originalIndex }) => (
                <div
                  key={`${constraint.guestAId}-${constraint.guestBId}-${originalIndex}`}
                  className="grid gap-2 data-row md:grid-cols-[auto_1fr_1fr_auto_auto]"
                >
                  <select
                    className="rounded border px-2 py-1"
                    value={constraint.type}
                    onChange={(event) =>
                      onUpdateConstraint(originalIndex, {
                        type: event.target.value as Constraint["type"],
                      })
                    }
                  >
                    <option value="must_pair">Must Pair</option>
                    <option value="cannot_pair">Cannot Pair</option>
                    <option value="prefer_near">Prefer Near</option>
                  </select>
                  <select
                    className="rounded border px-2 py-1"
                    value={constraint.guestAId}
                    onChange={(event) =>
                      onUpdateConstraint(originalIndex, { guestAId: event.target.value })
                    }
                  >
                    <option value="">Guest A</option>
                    {guests.map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded border px-2 py-1"
                    value={constraint.guestBId}
                    onChange={(event) =>
                      onUpdateConstraint(originalIndex, { guestBId: event.target.value })
                    }
                  >
                    <option value="">Guest B</option>
                    {guests.map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-24 rounded border px-2 py-1"
                    type="number"
                    min={1}
                    max={20}
                    value={constraint.weight}
                    onChange={(event) =>
                      onUpdateConstraint(originalIndex, { weight: Number(event.target.value) })
                    }
                  />
                  <button
                    className="rounded bg-red-600 px-3 py-1 text-white"
                    onClick={() => onDeleteConstraint(originalIndex)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
        {!constraints.length && <p className="text-zinc-500">No constraints added yet.</p>}
        {hasNoMatches && (
          <p className="text-zinc-500">No constraints match your current search.</p>
        )}
      </div>
    </section>
  );
}
