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
    <div className="scrollbar-hide -mx-4 flex gap-1 overflow-x-auto border-b border-slate-300/80 px-4 pb-px sm:mx-0 sm:px-0">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
            active === t.id
              ? "bg-white/95 font-semibold text-emerald-800 ring-1 ring-slate-300/80"
              : "text-slate-600 hover:bg-white/60 hover:text-[#0f172a]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
