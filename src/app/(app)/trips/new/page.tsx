"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getDb } from "@/lib/firebase/client";
import { generateInviteToken } from "@/lib/trip-utils";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "rounded-xl border border-slate-300/80 bg-white px-3 py-2 text-[#0f172a] shadow-sm ring-1 ring-black/5 placeholder:text-slate-400";

export default function NewTripPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const n = name.trim();
    if (!n) {
      setError("Trip name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const db = getDb();
      const tripRef = doc(collection(db, "trips"));
      const tripId = tripRef.id;
      const inviteToken = generateInviteToken();
      const displayName =
        user.displayName || user.email?.split("@")[0] || "Organizer";
      const batch = writeBatch(db);
      batch.set(tripRef, {
        name: n,
        description: description.trim(),
        startDate,
        ...(endDate.trim() ? { endDate: endDate.trim() } : {}),
        createdBy: user.uid,
        inviteToken,
        memberIds: [user.uid],
        closed: false,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, "inviteLookups", inviteToken), {
        tripId,
        tripName: n,
      });
      batch.set(doc(db, "trips", tripId, "members", user.uid), {
        userId: user.uid,
        name: displayName,
        email: user.email ?? null,
        role: "admin",
        joinedAt: serverTimestamp(),
      });
      await batch.commit();
      router.push(`/trips/${tripId}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create trip");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <Link
        href="/dashboard"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Back to trips
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-[#0f172a]">New trip</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Weekend ride to the coast"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              End date (optional)
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputClass}
            placeholder="Optional details for your group"
          />
        </label>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-emerald-800 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-800/35 transition hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create trip"}
        </button>
      </form>
    </div>
  );
}
