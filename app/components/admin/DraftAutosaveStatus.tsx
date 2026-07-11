export type AutosaveState = "saved" | "saving" | "dirty";

const labels: Record<AutosaveState, string> = {
  saved: "Kopia robocza zapisana",
  saving: "Zapisywanie kopii roboczej…",
  dirty: "Niezapisane zmiany",
};

export function DraftAutosaveStatus({ state }: { state: AutosaveState }) {
  return (
    <span className={`autosave-status autosave-${state}`}>
      <span aria-hidden="true" />
      {labels[state]}
    </span>
  );
}
