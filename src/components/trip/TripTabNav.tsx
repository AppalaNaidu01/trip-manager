"use client";

export type TripTabId =
  | "overview"
  | "expenses"
  | "photos"
  | "route"
  | "checklist"
  | "members";

const TABS: { id: TripTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "expenses", label: "Expenses" },
  { id: "photos", label: "Photos" },
  { id: "route", label: "Route" },
  { id: "checklist", label: "Checklist" },
  { id: "members", label: "Members" },
];

export function TripTabNav({
  active,
  onChange,
}: {
  active: TripTabId;
  onChange: (id: TripTabId) => void;
}) {
  return (
    <div className="scrollbar-hide -mx-4 flex gap-1 overflow-x-auto border-b border-zinc-200 px-4 pb-px dark:border-zinc-800 sm:mx-0 sm:px-0">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
            active === t.id
              ? "bg-white text-emerald-800 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-emerald-300 dark:ring-zinc-700"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
