import type { GeneratedPlan, Guest, Table } from "@/lib/solver/types";

type SeatPoint = {
  x: number;
  y: number;
};

type AssignmentsByTableItem = {
  table: Table;
  assignments: GeneratedPlan["assignments"];
};

type OutputSectionProps = {
  generatedPlan: GeneratedPlan | null;
  normalizedConstraintAccuracy: number | null;
  assignmentsByTable: AssignmentsByTableItem[];
  guestById: Map<string, Guest>;
  tableById: Map<string, Table>;
};

const getRectangularSeatPoint = (seatIndex: number, seatCount: number): SeatPoint => {
  const width = 170;
  const height = 110;
  const offset = 24;
  const centerX = 140;
  const centerY = 110;
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  const top = centerY - height / 2;
  const bottom = centerY + height / 2;
  const perimeter = 2 * (width + height);
  const distance = ((seatIndex + 0.5) / Math.max(1, seatCount)) * perimeter;

  if (distance < width) {
    return { x: left + distance, y: top - offset };
  }
  if (distance < width + height) {
    return { x: right + offset, y: top + (distance - width) };
  }
  if (distance < width * 2 + height) {
    return {
      x: right - (distance - (width + height)),
      y: bottom + offset,
    };
  }
  return {
    x: left - offset,
    y: bottom - (distance - (width * 2 + height)),
  };
};

const getGuestInitials = (name: string): string => {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return "?";
  }
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }
  return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
};

export function OutputSection({
  generatedPlan,
  normalizedConstraintAccuracy,
  assignmentsByTable,
  guestById,
  tableById,
}: OutputSectionProps) {
  return (
    <section className="grid gap-3 rounded border p-4">
      <h2 className="text-xl font-semibold">5) Output</h2>
      {generatedPlan && (
        <div className="grid gap-2 text-sm">
          <p>
            Constraint Accuracy:{" "}
            <strong>{normalizedConstraintAccuracy?.toFixed(1) ?? "1.0"} / 100</strong> (seed{" "}
            {generatedPlan.meta.seed})
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Accuracy is normalized from the raw optimization score using your current constraints
            and weights.
          </p>
          <p>
            Violations: <strong>{generatedPlan.meta.violations.length}</strong>
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {assignmentsByTable.map(({ table, assignments }) => (
              <article
                key={table.id}
                className="rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <h3 className="text-base font-semibold">{table.label}</h3>
                <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-300">
                  {assignments.length} / {table.seats} seats filled
                </p>
                {table.shape === "rectangular" && (
                  <div className="mb-3 overflow-x-auto rounded border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950">
                    <svg
                      viewBox="0 0 280 220"
                      role="img"
                      aria-label={`Seating diagram for ${table.label}`}
                      className="h-56 w-full min-w-[280px]"
                    >
                      <rect
                        x={55}
                        y={55}
                        width={170}
                        height={110}
                        rx={8}
                        fill="#e4e4e7"
                        stroke="#52525b"
                        strokeWidth={2}
                      />
                      <text
                        x={140}
                        y={113}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={12}
                        fill="#27272a"
                      >
                        {table.label}
                      </text>
                      {Array.from({ length: table.seats }, (_, seatIndex) => {
                        const point = getRectangularSeatPoint(seatIndex, table.seats);
                        const assignment = assignments.find(
                          (current) => current.seatIndex === seatIndex,
                        );
                        const guestName = assignment
                          ? guestById.get(assignment.guestId)?.name
                          : undefined;
                        const chairLabel = guestName
                          ? getGuestInitials(guestName)
                          : `${seatIndex + 1}`;

                        return (
                          <g key={`${table.id}-seat-${seatIndex}`}>
                            <title>
                              {guestName
                                ? `Seat ${seatIndex + 1}: ${guestName}`
                                : `Seat ${seatIndex + 1}: Empty`}
                            </title>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r={15}
                              fill={guestName ? "#60a5fa" : "#f4f4f5"}
                              stroke="#3f3f46"
                              strokeWidth={1.5}
                            />
                            <text
                              x={point.x}
                              y={point.y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={10}
                              fontWeight={600}
                              fill={guestName ? "#0c4a6e" : "#3f3f46"}
                            >
                              {chairLabel}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
                <ul className="grid gap-1">
                  {assignments.map((assignment) => (
                    <li key={assignment.guestId}>
                      <span className="font-medium">Seat {assignment.seatIndex}:</span>{" "}
                      {guestById.get(assignment.guestId)?.name}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <ul className="grid gap-1 text-xs text-zinc-600 dark:text-zinc-300">
            {generatedPlan.assignments
              .filter((assignment) => !tableById.has(assignment.tableId))
              .map((assignment) => (
                <li key={`${assignment.tableId}-${assignment.guestId}`}>
                  {guestById.get(assignment.guestId)?.name} assigned to unknown table{" "}
                  {assignment.tableId}
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  );
}
