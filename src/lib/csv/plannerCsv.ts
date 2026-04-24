import type { Assignment, Guest, Table } from "@/lib/solver/types";

const ESCAPE_PATTERN = /"/g;

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(ESCAPE_PATTERN, '""')}"`;
  }
  return value;
}

export function parseGuestCsv(csvText: string): string[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const [header, ...rows] = lines;
  const headerColumns = header
    .split(",")
    .map((col) => col.trim().toLowerCase());
  const nameIndex = headerColumns.indexOf("name");
  if (nameIndex === -1) {
    throw new Error('CSV must include a "name" header column.');
  }

  const names: string[] = [];
  for (const row of rows) {
    const cols = row.split(",").map((col) => col.trim());
    const name = cols[nameIndex];
    if (name) {
      names.push(name);
    }
  }

  return names;
}

export function buildAssignmentsCsv(
  assignments: Assignment[],
  guests: Guest[],
  tables: Table[],
): string {
  const guestById = new Map(guests.map((guest) => [guest.id, guest]));
  const tableById = new Map(tables.map((table) => [table.id, table]));

  const sortedAssignments = [...assignments].sort((a, b) => {
    const tableA = tableById.get(a.tableId)?.label ?? "";
    const tableB = tableById.get(b.tableId)?.label ?? "";
    if (tableA !== tableB) {
      return tableA.localeCompare(tableB);
    }
    return a.seatIndex - b.seatIndex;
  });

  const lines = ["guest_name,table_label,seat_index"];
  for (const assignment of sortedAssignments) {
    const guest = guestById.get(assignment.guestId);
    const table = tableById.get(assignment.tableId);
    if (!guest || !table) {
      continue;
    }
    lines.push(
      [
        escapeCsvCell(guest.name),
        escapeCsvCell(table.label),
        String(assignment.seatIndex),
      ].join(","),
    );
  }

  return lines.join("\n");
}
