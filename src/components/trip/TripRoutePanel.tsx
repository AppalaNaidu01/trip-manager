"use client";

import { mapTripRoute } from "@/lib/firestore-map";
import { getDb } from "@/lib/firebase/client";
import type { RouteStop, Trip, TripRoute } from "@/types/models";
import type { User } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const ROUTE_DOC = "summary";

export function TripRoutePanel({
  tripId,
  trip,
  user,
}: {
  tripId: string;
  trip: Trip;
  user: User | null;
}) {
  const [route, setRoute] = useState<TripRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [routeNotes, setRouteNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const closed = trip.closed === true;

  useEffect(() => {
    const db = getDb();
    const ref = doc(db, "trips", tripId, "route", ROUTE_DOC);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setLoading(false);
        if (!snap.exists()) {
          setRoute(null);
          return;
        }
        const r = mapTripRoute(tripId, snap.data());
        setRoute(r);
        setStartLocation(r.startLocation);
        setDestination(r.destination);
        setStops(r.stops.length ? r.stops : []);
        setDistanceText(r.distanceText);
        setDurationText(r.durationText);
        setRouteNotes(r.routeNotes);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [tripId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || closed) return;
    setSaving(true);
    try {
      const db = getDb();
      const ref = doc(db, "trips", tripId, "route", ROUTE_DOC);
      const ordered = stops.map((s, i) => ({ ...s, order: i }));
      const payload: Record<string, unknown> = {
        startLocation: startLocation.trim(),
        destination: destination.trim(),
        stops: ordered,
        distanceText: distanceText.trim(),
        durationText: durationText.trim(),
        routeNotes: routeNotes.trim(),
        updatedAt: serverTimestamp(),
      };
      if (!route) {
        payload.createdBy = user.uid;
        payload.createdAt = serverTimestamp();
      }
      await setDoc(ref, payload, { merge: true });
    } finally {
      setSaving(false);
    }
  }

  function addStop() {
    setStops((s) => [
      ...s,
      { name: "", order: s.length, notes: "" },
    ]);
  }

  function updateStop(i: number, patch: Partial<RouteStop>) {
    setStops((prev) =>
      prev.map((x, j) => (j === i ? { ...x, ...patch } : x)),
    );
  }

  function removeStop(i: number) {
    setStops((prev) => prev.filter((_, j) => j !== i));
  }

  function moveStop(i: number, dir: -1 | 1) {
    setStops((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading route…</p>;
  }

  const field =
    "rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-sm text-[#0f172a] shadow-sm ring-1 ring-black/5";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Route plan</h2>
        <p className="mt-1 text-sm text-slate-600">
          Manual entry — maps integration comes later.
        </p>
      </div>

      {!closed && user ? (
        <form
          onSubmit={save}
          className="space-y-4 rounded-xl border border-slate-200 bg-white/95 p-4 ring-1 ring-black/5"
        >
          <label className="flex flex-col gap-1 text-sm">
            Start
            <input
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className={field}
              placeholder="City or address"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Destination
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={field}
            />
          </label>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Stops</span>
              <button
                type="button"
                onClick={addStop}
                className="text-sm font-medium text-emerald-800 hover:underline"
              >
                + Add stop
              </button>
            </div>
            <ul className="mt-2 space-y-2">
              {stops.map((stop, i) => (
                <li
                  key={i}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white/80 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">#{i + 1}</span>
                    <button
                      type="button"
                      className="text-xs text-slate-600"
                      onClick={() => moveStop(i, -1)}
                      disabled={i === 0}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className="text-xs text-slate-600"
                      onClick={() => moveStop(i, 1)}
                      disabled={i === stops.length - 1}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-xs text-red-600"
                      onClick={() => removeStop(i)}
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    value={stop.name}
                    onChange={(e) => updateStop(i, { name: e.target.value })}
                    placeholder="Stop name"
                    className={field}
                  />
                  <input
                    value={stop.notes ?? ""}
                    onChange={(e) =>
                      updateStop(i, {
                        notes: e.target.value || undefined,
                      })
                    }
                    placeholder="Notes (optional)"
                    className={field}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Distance (text)
              <input
                value={distanceText}
                onChange={(e) => setDistanceText(e.target.value)}
                placeholder="e.g. 120 km"
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Duration (text)
              <input
                value={durationText}
                onChange={(e) => setDurationText(e.target.value)}
                placeholder="e.g. 3 hours"
                className={field}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Route notes
            <textarea
              value={routeNotes}
              onChange={(e) => setRouteNotes(e.target.value)}
              rows={3}
              className={field}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save route"}
          </button>
        </form>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 ring-1 ring-black/5">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Start</dt>
              <dd className="font-medium text-[#0f172a]">
                {route?.startLocation || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Destination</dt>
              <dd className="font-medium text-[#0f172a]">
                {route?.destination || "—"}
              </dd>
            </div>
            {route?.stops?.length ? (
              <div>
                <dt className="text-slate-500">Stops</dt>
                <dd>
                  <ol className="mt-1 list-decimal pl-5">
                    {route.stops.map((s, i) => (
                      <li key={i}>
                        {s.name}
                        {s.notes ? (
                          <span className="text-slate-500"> — {s.notes}</span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </dd>
              </div>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Distance</dt>
                <dd>{route?.distanceText || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Duration</dt>
                <dd>{route?.durationText || "—"}</dd>
              </div>
            </div>
            {route?.routeNotes ? (
              <div>
                <dt className="text-slate-500">Notes</dt>
                <dd className="whitespace-pre-wrap">{route.routeNotes}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}
    </div>
  );
}
