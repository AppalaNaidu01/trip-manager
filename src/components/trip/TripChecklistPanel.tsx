"use client";

import { mapChecklistItem } from "@/lib/firestore-map";
import { getDb } from "@/lib/firebase/client";
import {
  CHECKLIST_CATEGORIES,
  type ChecklistItem,
  type Trip,
  type TripMember,
} from "@/types/models";
import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

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
  const [category, setCategory] = useState<string>(CHECKLIST_CATEGORIES[0]);
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);

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

  const closed = trip.closed === true;

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!user || closed) return;
    const t = text.trim();
    if (!t) return;
    setSaving(true);
    try {
      const db = getDb();
      const ref = doc(collection(db, "trips", tripId, "checklistItems"));
      await setDoc(ref, {
        text: t,
        category,
        isCompleted: false,
        assignedTo: assignedTo ? assignedTo : null,
        createdBy: user.uid,
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setText("");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item: ChecklistItem) {
    if (closed) return;
    const db = getDb();
    const ref = doc(db, "trips", tripId, "checklistItems", item.id);
    const next = !item.isCompleted;
    await updateDoc(ref, {
      isCompleted: next,
      completedAt: next ? serverTimestamp() : null,
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

  const memberName = (uid: string) =>
    members.find((m) => m.userId === uid)?.name ?? uid.slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Packing and tasks</h2>
        <p className="mt-1 text-sm text-slate-600">
          Progress:{" "}
          <strong>
            {progress.done}/{progress.total}
          </strong>{" "}
          completed
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-emerald-800 transition-[width]"
            style={{
              width:
                progress.total === 0
                  ? "0%"
                  : `${(progress.done / progress.total) * 100}%`,
            }}
          />
        </div>
      </div>

      {!closed && user ? (
        <form
          onSubmit={addItem}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 ring-1 ring-black/5"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add an item…"
            className="rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-sm text-[#0f172a] shadow-sm ring-1 ring-black/5"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-slate-300/80 bg-white px-2 py-2 text-sm text-[#0f172a] shadow-sm ring-1 ring-black/5"
              >
                {CHECKLIST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Assign (optional)
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="rounded-lg border border-slate-300/80 bg-white px-2 py-2 text-sm text-[#0f172a] shadow-sm ring-1 ring-black/5"
              >
                <option value="">Anyone</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-2xl bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            {saving ? "Adding…" : "Add item"}
          </button>
        </form>
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 ring-1 ring-black/5"
          >
            <input
              type="checkbox"
              checked={item.isCompleted}
              disabled={closed}
              onChange={() => toggle(item)}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm ${
                  item.isCompleted
                    ? "text-slate-500 line-through"
                    : "text-[#0f172a]"
                }`}
              >
                {item.text}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.category}
                {item.assignedTo ? ` · ${memberName(item.assignedTo)}` : ""}
              </p>
              {!closed ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    value={item.assignedTo ?? ""}
                    onChange={(e) => updateAssign(item, e.target.value)}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-[#0f172a]"
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
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No checklist items yet.</p>
      ) : null}
    </div>
  );
}
