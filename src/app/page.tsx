"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { buildAssignmentsCsv, parseGuestCsv } from "@/lib/csv/plannerCsv";
import { generatePlan } from "@/lib/solver/generatePlan";
import type { Constraint, GeneratedPlan, Guest, Table } from "@/lib/solver/types";
import { validatePlannerInput } from "@/lib/validation/planner";
import { ConstraintsRulesSection } from "./components/ConstraintsRulesSection";
import { FooterSection } from "./components/FooterSection";
import { GenerationSection } from "./components/GenerationSection";
import { GuestEntrySection } from "./components/GuestEntrySection";
import { HeaderSection } from "./components/HeaderSection";
import { OutputSection } from "./components/OutputSection";
import { TableSetupSection } from "./components/TableSetupSection";

const SESSION_KEY = "seating-planner-session";

type SessionState = {
  guests: Guest[];
  constraints: Constraint[];
  tables: Table[];
  generatedPlan: GeneratedPlan | null;
};

const createId = () => crypto.randomUUID();

const INITIAL_STATE: SessionState = {
  guests: [],
  constraints: [],
  tables: [],
  generatedPlan: null,
};

const getInitialState = (): SessionState => {
  if (typeof window === "undefined") {
    return INITIAL_STATE;
  }
  const saved = window.sessionStorage.getItem(SESSION_KEY);
  if (!saved) {
    return INITIAL_STATE;
  }
  try {
    const parsed = JSON.parse(saved) as SessionState;
    return {
      ...parsed,
      tables: (parsed.tables ?? []).map((table) => ({
        ...table,
        shape: table.shape ?? "round",
      })),
    };
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return INITIAL_STATE;
  }
};

export default function Home() {
  const [state, setState] = useState<SessionState>(getInitialState);
  const [manualGuestName, setManualGuestName] = useState("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [constraintType, setConstraintType] =
    useState<Constraint["type"]>("must_pair");
  const [constraintA, setConstraintA] = useState("");
  const [constraintB, setConstraintB] = useState("");
  const [constraintWeight, setConstraintWeight] = useState(5);

  const [tableLabel, setTableLabel] = useState("");
  const [tableSeats, setTableSeats] = useState(8);
  const [tableShape, setTableShape] = useState<Table["shape"]>("round");

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }, [state]);

  const guestById = useMemo(
    () => new Map(state.guests.map((guest) => [guest.id, guest])),
    [state.guests],
  );
  const tableById = useMemo(
    () => new Map(state.tables.map((table) => [table.id, table])),
    [state.tables],
  );
  const assignmentsByTable = useMemo(() => {
    const generatedPlan = state.generatedPlan;
    if (!generatedPlan) {
      return [];
    }

    return state.tables
      .map((table) => {
        const assignments = generatedPlan.assignments
          .filter((assignment) => assignment.tableId === table.id)
          .sort((a, b) => a.seatIndex - b.seatIndex);
        return { table, assignments };
      })
      .filter(({ assignments }) => assignments.length > 0);
  }, [state.generatedPlan, state.tables]);
  const normalizedConstraintAccuracy = useMemo(() => {
    const generatedPlan = state.generatedPlan;
    if (!generatedPlan) {
      return null;
    }
    const { score, maxScoreReference } = generatedPlan.meta;
    if (maxScoreReference <= 0) {
      return 100;
    }
    const normalized = (score / maxScoreReference) * 100;
    return Math.min(100, Math.max(1, normalized));
  }, [state.generatedPlan]);

  const addGuest = () => {
    const name = manualGuestName.trim();
    if (!name) {
      return;
    }
    setState((prev) => ({
      ...prev,
      guests: [...prev.guests, { id: createId(), name }],
      generatedPlan: null,
    }));
    setManualGuestName("");
  };

  const clearAllGuests = () => {
    setState((prev) => ({
      ...prev,
      guests: [],
      constraints: [],
      generatedPlan: null,
    }));
    setConstraintA("");
    setConstraintB("");
    setErrorMessages([]);
  };

  const onCsvUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    try {
      const names = parseGuestCsv(text);
      if (!names.length) {
        setErrorMessages(["No valid guest rows were found in the CSV."]);
        return;
      }
      const incomingGuests = names.map((name) => ({ id: createId(), name }));
      setState((prev) => ({
        ...prev,
        guests: [...prev.guests, ...incomingGuests],
        generatedPlan: null,
      }));
      setErrorMessages([]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not parse guest CSV.";
      setErrorMessages([message]);
    } finally {
      event.target.value = "";
    }
  };

  const addConstraint = () => {
    if (!constraintA || !constraintB || constraintA === constraintB) {
      return;
    }
    setState((prev) => ({
      ...prev,
      constraints: [
        ...prev.constraints,
        {
          type: constraintType,
          guestAId: constraintA,
          guestBId: constraintB,
          weight: Math.max(1, constraintWeight),
        },
      ],
      generatedPlan: null,
    }));
  };

  const updateConstraint = (
    index: number,
    patch: Partial<Pick<Constraint, "type" | "guestAId" | "guestBId" | "weight">>,
  ) => {
    setState((prev) => ({
      ...prev,
      constraints: prev.constraints.map((constraint, currentIndex) => {
        if (currentIndex !== index) {
          return constraint;
        }
        return {
          ...constraint,
          ...patch,
          weight:
            patch.weight !== undefined
              ? Math.max(1, patch.weight)
              : constraint.weight,
        };
      }),
      generatedPlan: null,
    }));
  };

  const deleteConstraint = (index: number) => {
    setState((prev) => ({
      ...prev,
      constraints: prev.constraints.filter((_, currentIndex) => currentIndex !== index),
      generatedPlan: null,
    }));
  };

  const addTable = () => {
    const trimmed = tableLabel.trim();
    if (!trimmed || tableSeats < 1) {
      return;
    }
    setState((prev) => ({
      ...prev,
      tables: [
        ...prev.tables,
        {
          id: createId(),
          label: trimmed,
          seats: Math.max(1, tableSeats),
          shape: tableShape,
        },
      ],
      generatedPlan: null,
    }));
    setTableLabel("");
    setTableSeats(8);
    setTableShape("round");
  };

  const updateTable = (
    tableId: string,
    patch: Partial<Pick<Table, "label" | "seats" | "shape">>,
  ) => {
    setState((prev) => ({
      ...prev,
      tables: prev.tables.map((table) => {
        if (table.id !== tableId) {
          return table;
        }
        return {
          ...table,
          ...patch,
          label: patch.label ?? table.label,
          seats: patch.seats !== undefined ? Math.max(1, patch.seats) : table.seats,
        };
      }),
      generatedPlan: null,
    }));
  };

  const deleteTable = (tableId: string) => {
    setState((prev) => ({
      ...prev,
      tables: prev.tables.filter((table) => table.id !== tableId),
      generatedPlan: null,
    }));
  };

  const generate = () => {
    const validation = validatePlannerInput(
      state.guests,
      state.tables,
      state.constraints,
    );
    if (!validation.ok) {
      setErrorMessages(validation.errors);
      return;
    }

    const generatedPlan = generatePlan(
      state.guests,
      state.tables,
      state.constraints,
    );
    setState((prev) => ({ ...prev, generatedPlan }));
    setErrorMessages([]);
  };

  const retry = () => {
    const generatedPlan = generatePlan(
      state.guests,
      state.tables,
      state.constraints,
    );
    setState((prev) => ({ ...prev, generatedPlan }));
  };

  const downloadAndDispose = () => {
    if (!state.generatedPlan) {
      return;
    }
    const csv = buildAssignmentsCsv(
      state.generatedPlan.assignments,
      state.guests,
      state.tables,
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "seating_assignments.csv";
    link.click();
    URL.revokeObjectURL(url);

    setState(INITIAL_STATE);
    sessionStorage.removeItem(SESSION_KEY);
    setErrorMessages([]);
  };

// LAYOUT

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 p-6 md:p-10">
      <HeaderSection />

      {errorMessages.length > 0 && (
        <section className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {errorMessages.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </section>
      )}
      {/* Guest Management Section */}
      <section className="flex gap-4">
        <div className="w-1/2">
        <GuestEntrySection
          guests={state.guests}
          manualGuestName={manualGuestName}
          onManualGuestNameChange={setManualGuestName}
          onAddGuest={addGuest}
          onClearAllGuests={clearAllGuests}
          onCsvUpload={onCsvUpload}
        />
        </div>
        <div className="w-1/2">       
        <ConstraintsRulesSection
          guests={state.guests}
          constraints={state.constraints}
          constraintType={constraintType}
          constraintA={constraintA}
          constraintB={constraintB}
          constraintWeight={constraintWeight}
          onConstraintTypeChange={setConstraintType}
          onConstraintAChange={setConstraintA}
          onConstraintBChange={setConstraintB}
          onConstraintWeightChange={setConstraintWeight}
          onAddConstraint={addConstraint}
          onUpdateConstraint={updateConstraint}
          onDeleteConstraint={deleteConstraint}
        />
        </div>
      </section>

      {/* Table Setup */}

      <TableSetupSection
        tables={state.tables}
        tableLabel={tableLabel}
        tableSeats={tableSeats}
        tableShape={tableShape}
        onTableLabelChange={setTableLabel}
        onTableSeatsChange={setTableSeats}
        onTableShapeChange={setTableShape}
        onAddTable={addTable}
        onUpdateTable={updateTable}
        onDeleteTable={deleteTable}
      />

      <GenerationSection
        hasGeneratedPlan={Boolean(state.generatedPlan)}
        onGenerate={generate}
        onRetry={retry}
      />

      <OutputSection
        generatedPlan={state.generatedPlan}
        normalizedConstraintAccuracy={normalizedConstraintAccuracy}
        assignmentsByTable={assignmentsByTable}
        guestById={guestById}
        tableById={tableById}
      />

      <FooterSection
        hasGeneratedPlan={Boolean(state.generatedPlan)}
        onDownloadAndDispose={downloadAndDispose}
      />
    </main>
  );
}
