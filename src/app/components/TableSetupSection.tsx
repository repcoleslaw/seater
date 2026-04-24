import type { Table } from "@/lib/solver/types";

type TableSetupSectionProps = {
  tables: Table[];
  tableLabel: string;
  tableSeats: number;
  tableShape: Table["shape"];
  onTableLabelChange: (value: string) => void;
  onTableSeatsChange: (value: number) => void;
  onTableShapeChange: (value: Table["shape"]) => void;
  onAddTable: () => void;
  onUpdateTable: (tableId: string, patch: Partial<Pick<Table, "label" | "seats" | "shape">>) => void;
  onDeleteTable: (tableId: string) => void;
};

export function TableSetupSection({
  tables,
  tableLabel,
  tableSeats,
  tableShape,
  onTableLabelChange,
  onTableSeatsChange,
  onTableShapeChange,
  onAddTable,
  onUpdateTable,
  onDeleteTable,
}: TableSetupSectionProps) {
  return (
    <section className="grid gap-3 rounded border p-4">
      <h2 className="text-xl font-semibold">3) Tables</h2>
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded border px-3 py-2"
          placeholder="Table label"
          value={tableLabel}
          onChange={(event) => onTableLabelChange(event.target.value)}
        />
        <input
          className="w-28 rounded border px-3 py-2"
          type="number"
          min={1}
          value={tableSeats}
          onChange={(event) => onTableSeatsChange(Number(event.target.value))}
        />
        <select
          className="rounded border px-3 py-2"
          value={tableShape}
          onChange={(event) => onTableShapeChange(event.target.value as Table["shape"])}
        >
          <option value="round">Round</option>
          <option value="rectangular">Rectangular</option>
        </select>
        <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={onAddTable}>
          Add Table
        </button>
      </div>
      <div className="grid gap-2 text-sm">
        {tables.map((table) => (
          <details key={table.id} className="rounded border border-zinc-200 p-2">
            <summary className="cursor-pointer select-none">
              {table.label}: {table.seats} seats ({table.shape})
            </summary>
            <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
              <input
                className="rounded border px-2 py-1"
                value={table.label}
                onChange={(event) => onUpdateTable(table.id, { label: event.target.value.trimStart() })}
              />
              <input
                className="w-24 rounded border px-2 py-1"
                type="number"
                min={1}
                value={table.seats}
                onChange={(event) => onUpdateTable(table.id, { seats: Number(event.target.value) })}
              />
              <select
                className="rounded border px-2 py-1"
                value={table.shape}
                onChange={(event) =>
                  onUpdateTable(table.id, {
                    shape: event.target.value as Table["shape"],
                  })
                }
              >
                <option value="round">Round</option>
                <option value="rectangular">Rectangular</option>
              </select>
              <button
                className="rounded bg-red-600 px-3 py-1 text-white"
                onClick={() => onDeleteTable(table.id)}
              >
                Delete
              </button>
            </div>
          </details>
        ))}
        {!tables.length && <p className="text-zinc-500">No tables added yet.</p>}
      </div>
    </section>
  );
}
