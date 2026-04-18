"use client";

import { useAuth } from "@/contexts/AuthContext";
import { docSnapToTrip } from "@/lib/firestore-map";
import { getDb } from "@/lib/firebase/client";
import type { Trip } from "@/types/models";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const db = getDb();
    const q = query(
      collection(db, "trips"),
      where("memberIds", "array-contains", user.uid),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(docSnapToTrip);
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setTrips(list);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError(err.message);
      },
    );
    return () => unsub();
  }, [user]);

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Your trips
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Create a trip or open one you have joined.
          </p>
        </div>
        <Link
          href="/trips/new"
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-500"
        >
          New trip
        </Link>
      </div>

      {error && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          role="alert"
        >
          <p className="font-medium">Could not load trips</p>
          <p className="mt-1 opacity-90">{error}</p>
          <p className="mt-2 text-xs">
            If this mentions an index, create the composite index from the link in
            the browser console, or in Firebase Console → Firestore → Indexes.
          </p>
        </div>
      )}

      {trips.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-zinc-600 dark:text-zinc-400">No trips yet.</p>
          <Link
            href="/trips/new"
            className="mt-4 inline-block text-sm font-semibold text-emerald-700 underline dark:text-emerald-400"
          >
            Create your first trip
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {trips.map((t) => (
            <li key={t.id}>
              <Link
                href={`/trips/${t.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {t.name}
                      {t.closed ? (
                        <span className="ml-2 text-xs font-normal text-zinc-500">
                          (closed)
                        </span>
                      ) : null}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {t.description || "No description"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">{t.date}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
