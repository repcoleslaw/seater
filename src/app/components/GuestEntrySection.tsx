"use client";
import type { ChangeEvent } from "react";

import type { Guest } from "@/lib/solver/types";

type GuestEntrySectionProps = {
  guests: Guest[];
  manualGuestName: string;
  onManualGuestNameChange: (value: string) => void;
  onAddGuest: () => void;
  onClearAllGuests: () => void;
  onCsvUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function GuestEntrySection({
  guests,
  manualGuestName,
  onManualGuestNameChange,
  onAddGuest,
  onClearAllGuests,
  onCsvUpload,
}: GuestEntrySectionProps) {


  return (
    <section className="rounded border p-4">
      <h2 className="text-xl font-semibold">Add Guests</h2>
      <p>Let's start by adding some guests to your list.</p>
      <div className="flex flex-col gap-2 w-full">
        {/* manual guest entry input */}
        <input
          className="rounded border px-3 py-2 w-full"
          placeholder="Guest name"
          value={manualGuestName}
          onChange={(event) => onManualGuestNameChange(event.target.value)}
        />
        <div className="flex  w-full gap-2">
          {/* manual guest entry btn */}
          <button className="primary-button w-1/2" onClick={onAddGuest}>
            Add Guest
          </button>
          {/* CSV Upload */}
          <input
            className="rounded w-1/2 border px-3 py-2 hover:bg-neutral-700"
            type="file"
            accept=".csv,text/csv"
            onChange={onCsvUpload}
          />
        </div>
       
      </div>

      <hr className="my-4"/>
      <ul className="grid gap-1 text-sm">
        { !guests.length ? (
          <p className="text-neutral-500">Why don't you try adding some guests?</p>
        ) : (
          guests.map((guest) => (
            <li className="data-row" key={guest.id}>{guest.name}</li>
          ))
        )}
        
      </ul>
      <hr className="my-4"/>
      <button
          className="secondary-button w-full"
          onClick={onClearAllGuests}
          disabled={!guests.length}
        >
          Clear All Guests
        </button>
    </section>
  );
}
