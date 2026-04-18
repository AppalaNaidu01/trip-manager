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
    <div className="scrollbar-hide flex gap-5 overflow-x-auto border-b border-slate-200/90 pb-0">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`relative shrink-0 pb-3 text-sm font-semibold transition ${
            active === t.id
              ? "text-[#14532d]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t.label}
          {active === t.id ? (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#14532d]" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
