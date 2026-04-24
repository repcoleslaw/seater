export type Guest = {
  id: string;
  name: string;
};

export type Table = {
  id: string;
  label: string;
  seats: number;
  shape: "round" | "rectangular";
};

export type ConstraintType = "must_pair" | "cannot_pair" | "prefer_near";

export type Constraint = {
  type: ConstraintType;
  guestAId: string;
  guestBId: string;
  weight: number;
};

export type Assignment = {
  guestId: string;
  tableId: string;
  seatIndex: number;
};

export type GenerationMeta = {
  seed: number;
  score: number;
  maxScoreReference: number;
  violations: Violation[];
};

export type Violation = {
  type: ConstraintType;
  guestIds: [string, string];
  tableId: string | null;
  message: string;
};

export type GeneratedPlan = {
  assignments: Assignment[];
  meta: GenerationMeta;
};
