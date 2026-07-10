"use client";

import type { MatchAnalysisRecord, PublicationStatus } from "@/lib/types";
import { AnalysisSlotCard } from "./AnalysisSlotCard";

export function AnalysisSlots({
  matches,
  onAdd,
  onEdit,
  onDelete,
  onStatus,
}: {
  matches: MatchAnalysisRecord[];
  onAdd: (slot: number) => void;
  onEdit: (match: MatchAnalysisRecord) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, status: PublicationStatus) => void;
}) {
  const slots = Array.from({ length: 20 }, (_, index) => index + 1);

  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {slots.map((slot) => (
        <AnalysisSlotCard
          key={slot}
          slotNumber={slot}
          match={matches.find((item) => item.slotNumber === slot)}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatus={onStatus}
        />
      ))}
    </div>
  );
}
