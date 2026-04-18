"use client";

import { mapChecklistItem } from "@/lib/firestore-map";
import { getDb } from "@/lib/firebase/client";
import {
  CHECKLIST_CATEGORIES,
  type ChecklistCategory,
  type ChecklistItem,
  type Trip,
  type TripMember,
} from "@/types/models";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

const CATEGORY_TITLE: Partial<Record<ChecklistCategory, string>> = {
  Documents: "Essential documents",
  Safety: "Safety",
  Clothing: "Mountain clothing",
  "Bike essentials": "Alpine gear",
  "Food / water": "Food & water",
  Electronics: "Electronics",
  Other: "Other",
};

function CategoryIcon({ category }: { category: string }) {
  const c = category.toLowerCase();
  if (c.includes("document"))
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    );
  if (c.includes("cloth") || c.includes("gear"))
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M20.38 3.46 16 2a4 4 0 0 1-3.62 2.22L8 6H6a2 2 0 0 0-2 2v2l2.38.64A4 4 0 0 1 10 12a4 4 0 0 1-1.62 3.36L6 16v2a2 2 0 0 0 2 2h2l3.38-2.64A4 4 0 0 1 16 12a4 4 0 0 1 3.62 2.22L22 18v-2l-2.38-.64A4 4 0 0 1 18 12a4 4 0 0 1 1.62-3.36L22 6V4a2 2 0 0 0-2-2h-2l-2.38.64A4 4 0 0 1 12 4a4 4 0 0 1-1.62-3.36Z" />
      </svg>
    );
  if (c.includes("bike") || c.includes("food") || c.includes("water"))
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6M9 15h6" />
    </svg>
  );
}

function normalizeCategory(cat: string): ChecklistCategory {
  return CHECKLIST_CATEGORIES.includes(cat as ChecklistCategory)
    ? (cat as ChecklistCategory)
    : "Other";
}

export function TripChecklistPanel({
  tripId,
  trip,
  user,
  members,
}: {
  tripId: string;
  trip: Trip;
  user: User | null;
  members: TripMember[];
}) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<string>("Documents");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);

  const closed = trip.closed === true;

  useEffect(() => {
    const db = getDb();
    const col = collection(db, "trips", tripId, "checklistItems");
    const unsub = onSnapshot(col, (snap) => {
      const list = snap.docs.map((d) =>
        mapChecklistItem(d.id, tripId, d.data()),
      );
      list.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return ta - tb;
      });
      setItems(list);
    });
    return () => unsub();
  }, [tripId]);

  const progress = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.isCompleted).length;
    return { done, total };
  }, [items]);

  const grouped = useMemo(() => {
    const order: string[] = [...CHECKLIST_CATEGORIES];
    const map = new Map<string, ChecklistItem[]>();
    for (const c of order) map.set(c, []);
    for (const item of items) {
      const key = normalizeCategory(item.category);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return order
      .filter((c) => (map.get(c)?.length ?? 0) > 0)
      .map((c) => ({ category: c, items: map.get(c)! }));
  }, [items]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!user || closed) return;
    const t = text.trim();
    if (!t) return;
    setSaving(true);
    try {
      const db = getDb();
      const ref = doc(collection(db, "trips", tripId, "checklistItems"));
      const n = notes.trim();
      await setDoc(ref, {
        text: t,
        ...(n ? { notes: n } : {}),
        category,
        isCompleted: false,
        assignedTo: assignedTo ? assignedTo : null,
        createdBy: user.uid,
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setText("");
      setNotes("");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item: ChecklistItem) {
    if (closed || !user) return;
    const db = getDb();
    const ref = doc(db, "trips", tripId, "checklistItems", item.id);
    const next = !item.isCompleted;
    await updateDoc(ref, {
      isCompleted: next,
      completedAt: next ? serverTimestamp() : null,
      completedBy: next ? user.uid : null,
      updatedAt: serverTimestamp(),
    });
  }

  async function updateAssign(item: ChecklistItem, uid: string) {
    if (closed) return;
    const db = getDb();
    await updateDoc(doc(db, "trips", tripId, "checklistItems", item.id), {
      assignedTo: uid || null,
      updatedAt: serverTimestamp(),
    });
  }

  async function removeItem(item: ChecklistItem) {
    if (closed) return;
    if (!confirm("Remove this item?")) return;
    await deleteDoc(doc(getDb(), "trips", tripId, "checklistItems", item.id));
  }

  async function sendReminder() {
    if (!user || closed) return;
    if (!confirm("Notify everyone on this trip to check the packing list?")) return;
    setReminderSending(true);
    try {
      const db = getDb();
      await addDoc(collection(db, "trips", tripId, "checklistReminders"), {
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
    } finally {
      setReminderSending(false);
    }
  }

  const memberName = (uid: string) =>
    members.find((m) => m.userId === uid)?.name ?? uid.slice(0, 8);

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0f172a] shadow-sm ring-1 ring-black/[0.04] outline-none focus:ring-2 focus:ring-[#14532d]/25";

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[1.75rem] border border-slate-100 bg-[#efeee8]/90 p-5 shadow-sm ring-1 ring-black/[0.04]">
        <h2 className="text-lg font-semibold text-[#14532d]">
          Packing and tasks
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Keep track of everything you need for the trip.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            {progress.done}/{progress.total} completed
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200/90">
          <div
            className="h-full rounded-full bg-[#14532d] transition-[width] duration-300"
            style={{
              width:
                progress.total === 0
                  ? "0%"
                  : `${(progress.done / progress.total) * 100}%`,
            }}
          />
        </div>

        {user && !closed ? (
          <button
            type="button"
            onClick={() => void sendReminder()}
            disabled={reminderSending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#14532d]/35 bg-white py-3 text-sm font-semibold text-[#14532d] shadow-sm transition hover:border-[#14532d]/55 hover:bg-emerald-50/60 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {reminderSending ? "Sending…" : "Reminder"}
          </button>
        ) : null}
      </section>

      {!closed && user ? (
        <form onSubmit={addItem} className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              New item
            </span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What do you need to pack?"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Detail (optional)
            </span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brand, size, link…"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={field}
            >
              {CHECKLIST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_TITLE[c] ?? c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Assign (optional)
            </span>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className={field}
            >
              <option value="">Anyone</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.userId === user.uid ? "You" : m.name}
              </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#14532d] text-sm font-semibold text-white shadow-md shadow-emerald-950/15 transition hover:brightness-110 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            {saving ? "Adding…" : "Add task"}
          </button>
        </form>
      ) : null}

      {!user ? (
        <p className="text-sm text-slate-500">Sign in to edit the checklist.</p>
      ) : null}

      <div className="flex flex-col gap-8">
        {grouped.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            No checklist items yet.
          </p>
        ) : (
          grouped.map(({ category: cat, items: sectionItems }) => (
            <section key={cat}>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#14532d]">
                  <CategoryIcon category={cat} />
                </span>
                <h3 className="text-base font-semibold text-[#14532d]">
                  {CATEGORY_TITLE[cat as ChecklistCategory] ?? cat}
                </h3>
              </div>
              <ul className="flex flex-col gap-2">
                {sectionItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.03]"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        disabled={closed || !user}
                        onChange={() => toggle(item)}
                        className="mt-1 h-[18px] w-[18px] shrink-0 rounded border-slate-300 text-[#14532d] focus:ring-[#14532d]"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            item.isCompleted
                              ? "text-slate-400 line-through"
                              : "text-[#0f172a]"
                          }`}
                        >
                          {item.text}
                        </p>
                        {item.notes ? (
                          <p
                            className={`mt-0.5 text-xs ${
                              item.isCompleted ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {item.notes}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-slate-500">
                          {item.isCompleted && item.completedBy
                            ? `Completed by: ${memberName(item.completedBy)}`
                            : item.assignedTo
                              ? `Assigned to: ${item.assignedTo === user?.uid ? "You" : memberName(item.assignedTo)}`
                              : null}
                        </p>
                        {!closed && user ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <select
                              value={item.assignedTo ?? ""}
                              onChange={(e) => updateAssign(item, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-[#0f172a]"
                            >
                              <option value="">Anyone</option>
                              {members.map((m) => (
                                <option key={m.userId} value={m.userId}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeItem(item)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
