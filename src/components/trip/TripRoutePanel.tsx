"use client";

import { mapTripRoute } from "@/lib/firestore-map";
import { getDb } from "@/lib/firebase/client";
import {
  mediaGroupKey,
  ROUTE_SEGMENT_DESTINATION,
  ROUTE_SEGMENT_START,
  routeStopSegmentId,
} from "@/lib/route-segments";
import type { MediaItem, RouteStop, Trip, TripRoute } from "@/types/models";
import type { User } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

const ROUTE_DOC = "summary";

function splitLocation(s: string): { main: string; sub?: string } {
  const t = s.trim();
  if (!t) return { main: "—" };
  const parts = t.split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { main: parts[0]!, sub: parts.slice(1).join(", ") };
  }
  return { main: t };
}

function pinPositions(count: number): { left: string; top: string }[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const wave = Math.sin(i * 1.1) * 6;
    const left = 8 + t * 78 + wave * 0.3;
    const top = 68 - t * 48 + Math.cos(i * 0.9) * 5;
    return { left: `${Math.min(88, Math.max(8, left))}%`, top: `${Math.min(78, Math.max(12, top))}%` };
  });
}

function countForSegment(media: MediaItem[], segmentId: string): number {
  return media.filter((m) => mediaGroupKey(m.routeSegmentId) === segmentId).length;
}

function SegmentPhotosCue({
  count,
  onView,
}: {
  count: number;
  onView: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onView}
      className="mt-3 w-full rounded-xl border border-[#14532d]/25 bg-emerald-50/60 py-2.5 text-xs font-semibold text-[#14532d] transition hover:bg-emerald-50"
    >
      {count === 0
        ? "Open Photos (none for this stop yet)"
        : `Open Photos (${count})`}
    </button>
  );
}

function MapPin({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute z-[2] flex h-9 w-9 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-[#14532d] text-xs font-bold text-white shadow-lg shadow-emerald-950/25 ring-2 ring-white ${className ?? ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function TripRoutePanel({
  tripId,
  trip,
  user,
  media = [],
  photoCount = 0,
  onOpenPhotos,
  onOpenPhotosForSegment,
}: {
  tripId: string;
  trip: Trip;
  user: User | null;
  media?: MediaItem[];
  /** Trip media count & Photos tab opener (read-only route view). */
  photoCount?: number;
  onOpenPhotos?: () => void;
  /** Switches to Photos and filters to this checkpoint. */
  onOpenPhotosForSegment?: (segmentId: string) => void;
}) {
  const [route, setRoute] = useState<TripRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [avgSpeedText, setAvgSpeedText] = useState("");
  const [routeNotes, setRouteNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const closed = trip.closed === true;
  const canEdit = Boolean(user) && !closed;

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
        setAvgSpeedText(r.avgSpeedText ?? "");
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
        avgSpeedText: avgSpeedText.trim(),
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

  const stopListForMap = canEdit ? stops : route?.stops ?? [];

  const startParts = useMemo(
    () => splitLocation(canEdit ? startLocation : route?.startLocation ?? ""),
    [canEdit, startLocation, route?.startLocation],
  );
  const destParts = useMemo(
    () => splitLocation(canEdit ? destination : route?.destination ?? ""),
    [canEdit, destination, route?.destination],
  );

  const mapPins = useMemo(() => {
    const n = 1 + stopListForMap.length + 1;
    return pinPositions(n);
  }, [stopListForMap.length]);

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0f172a] shadow-sm ring-1 ring-black/[0.04] outline-none focus:ring-2 focus:ring-[#14532d]/25";

  if (loading) {
    return (
      <p className="text-sm text-slate-500">Loading route…</p>
    );
  }

  const displayStops = canEdit ? stops : route?.stops ?? [];

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-lg font-semibold text-[#14532d]">Journey Map</h2>
        <div className="relative mt-4 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-200 shadow-inner ring-1 ring-black/[0.04]">
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/journey-map-bg.png')" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-100/55 via-white/35 to-slate-200/45"
            aria-hidden
          />
          <div className="relative aspect-[4/3] w-full">
            <svg
              className="absolute inset-0 h-full w-full text-[#14532d]/45 drop-shadow-sm"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M 8 75 Q 35 55 50 45 T 92 28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {mapPins.map((pos, idx) => {
              const total = 1 + stopListForMap.length + 1;
              const isFirst = idx === 0;
              const isLast = idx === total - 1;
              const stopIdx = idx - 1;
              return (
                <MapPin key={`${idx}-${isFirst ? "s" : isLast ? "e" : stopIdx}`} style={{ left: pos.left, top: pos.top }}>
                  {isFirst ? "1" : isLast ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                      <path d="M4 22V4l15 8-15 8" />
                    </svg>
                  ) : (
                    String(stopIdx + 2)
                  )}
                </MapPin>
              );
            })}
          </div>
        </div>
      </section>

      {canEdit ? (
        <form onSubmit={save} className="flex flex-col gap-10">
          <section>
            <h2 className="text-lg font-semibold text-[#14532d]">Route Details</h2>
            <div className="relative mt-6 pl-6">
              <div className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200" aria-hidden />

              <div className="relative pb-10">
                <span className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white ring-2 ring-[#14532d]">
                  <span className="h-2 w-2 rounded-full bg-[#14532d]" />
                </span>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Start
                  </p>
                  <label className="mt-2 block">
                    <span className="sr-only">Start location</span>
                    <input
                      value={startLocation}
                      onChange={(e) => setStartLocation(e.target.value)}
                      className={field}
                      placeholder="City or address"
                    />
                  </label>
                  {startParts.sub ? (
                    <p className="mt-1 text-xs text-slate-500">{startParts.sub}</p>
                  ) : null}
                  {onOpenPhotosForSegment ? (
                    <SegmentPhotosCue
                      count={countForSegment(media, ROUTE_SEGMENT_START)}
                      onView={() => onOpenPhotosForSegment(ROUTE_SEGMENT_START)}
                    />
                  ) : null}
                </div>
              </div>

              {stops.map((stop, i) => (
                <div key={i} className="relative pb-10">
                  <span className="absolute -left-6 top-3 flex h-7 w-7 -translate-x-[2px] items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-500 shadow-sm">
                    #{i + 1}
                  </span>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
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
                      className={`${field} mt-2`}
                    />
                    {onOpenPhotosForSegment ? (
                      <SegmentPhotosCue
                        count={countForSegment(media, routeStopSegmentId(i))}
                        onView={() =>
                          onOpenPhotosForSegment(routeStopSegmentId(i))
                        }
                      />
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="text-xs font-medium text-slate-500 hover:text-slate-800"
                        onClick={() => moveStop(i, -1)}
                        disabled={i === 0}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-slate-500 hover:text-slate-800"
                        onClick={() => moveStop(i, 1)}
                        disabled={i === stops.length - 1}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                        onClick={() => removeStop(i)}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="relative pb-10">
                <button
                  type="button"
                  onClick={addStop}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-[#f9f9f7] py-4 text-sm font-semibold text-[#14532d] transition hover:border-[#14532d]/40 hover:bg-emerald-50/50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14532d] text-white">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  Add stop
                </button>
              </div>

              <div className="relative">
                <span className="absolute -left-6 top-3 flex h-8 w-8 -translate-x-[3px] items-center justify-center rounded-full bg-[#14532d] text-white shadow-md ring-2 ring-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                    <path d="M4 22V4l15 8-15 8" />
                  </svg>
                </span>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Destination
                  </p>
                  <label className="mt-2 block">
                    <span className="sr-only">Destination</span>
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className={field}
                      placeholder="Where you’re headed"
                    />
                  </label>
                  {destParts.sub ? (
                    <p className="mt-1 text-xs text-slate-500">{destParts.sub}</p>
                  ) : null}
                  {onOpenPhotosForSegment ? (
                    <SegmentPhotosCue
                      count={countForSegment(media, ROUTE_SEGMENT_DESTINATION)}
                      onView={() =>
                        onOpenPhotosForSegment(ROUTE_SEGMENT_DESTINATION)
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#14532d]">
              Metrics
            </h2>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#f4f4f0] p-4 ring-1 ring-black/[0.03]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#14532d] shadow-sm">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M12 21s-8-4.5-8-11a8 8 0 0 1 16 0c0 6.5-8 11-8 11z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">Total distance</p>
                  <input
                    value={distanceText}
                    onChange={(e) => setDistanceText(e.target.value)}
                    placeholder="e.g. 20 km"
                    className="mt-0.5 w-full border-0 bg-transparent p-0 text-lg font-bold text-[#14532d] placeholder:text-slate-300 focus:ring-0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#f4f4f0] p-4 ring-1 ring-black/[0.03]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#14532d] shadow-sm">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">Estimated time</p>
                  <input
                    value={durationText}
                    onChange={(e) => setDurationText(e.target.value)}
                    placeholder="e.g. 45 min"
                    className="mt-0.5 w-full border-0 bg-transparent p-0 text-lg font-bold text-[#14532d] placeholder:text-slate-300 focus:ring-0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#f4f4f0] p-4 ring-1 ring-black/[0.03]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#14532d] shadow-sm">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v3l3 2" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">Avg speed</p>
                  <input
                    value={avgSpeedText}
                    onChange={(e) => setAvgSpeedText(e.target.value)}
                    placeholder="e.g. 42 km/h"
                    className="mt-0.5 w-full border-0 bg-transparent p-0 text-lg font-bold text-[#14532d] placeholder:text-slate-300 focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </section>

          <label className="block">
            <span className="text-sm font-medium text-slate-600">Route notes</span>
            <textarea
              value={routeNotes}
              onChange={(e) => setRouteNotes(e.target.value)}
              rows={3}
              className={`${field} mt-2`}
              placeholder="Highlights, road conditions…"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="min-h-[52px] w-full rounded-2xl bg-[#14532d] text-sm font-semibold text-white shadow-md shadow-emerald-950/15 transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save route"}
          </button>
        </form>
      ) : (
        <RouteReadOnly
          route={route}
          stops={displayStops}
          media={media}
          photoCount={photoCount}
          onOpenPhotos={onOpenPhotos}
          onOpenPhotosForSegment={onOpenPhotosForSegment}
        />
      )}
    </div>
  );
}

function RouteReadOnly({
  route,
  stops,
  media,
  photoCount,
  onOpenPhotos,
  onOpenPhotosForSegment,
}: {
  route: TripRoute | null;
  stops: RouteStop[];
  media: MediaItem[];
  photoCount: number;
  onOpenPhotos?: () => void;
  onOpenPhotosForSegment?: (segmentId: string) => void;
}) {
  const startParts = splitLocation(route?.startLocation ?? "");
  const destParts = splitLocation(route?.destination ?? "");
  const hasContent =
    Boolean(route?.startLocation?.trim()) ||
    Boolean(route?.destination?.trim()) ||
    stops.length > 0;

  return (
    <>
      <section>
        <h2 className="text-lg font-semibold text-[#14532d]">Route Details</h2>
        {!hasContent ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            No route saved yet.
          </p>
        ) : (
          <div className="relative mt-6 pl-6">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200" aria-hidden />

            <div className="relative pb-10">
              <span className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white ring-2 ring-[#14532d]">
                <span className="h-2 w-2 rounded-full bg-[#14532d]" />
              </span>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Start
                </p>
                <p className="mt-1 text-base font-semibold text-[#0f172a]">
                  {startParts.main}
                </p>
                {startParts.sub ? (
                  <p className="mt-0.5 text-sm text-slate-500">{startParts.sub}</p>
                ) : null}
                {onOpenPhotosForSegment ? (
                  <SegmentPhotosCue
                    count={countForSegment(media, ROUTE_SEGMENT_START)}
                    onView={() => onOpenPhotosForSegment(ROUTE_SEGMENT_START)}
                  />
                ) : null}
              </div>
            </div>

            {stops.map((stop, i) => (
              <div key={i} className="relative pb-10">
                <span className="absolute -left-6 top-3 flex h-7 w-7 -translate-x-[2px] items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-500 shadow-sm">
                  #{i + 1}
                </span>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
                  <p className="font-semibold text-[#0f172a]">{stop.name || "—"}</p>
                  {stop.notes ? (
                    <p className="mt-1 text-sm text-slate-600">{stop.notes}</p>
                  ) : null}
                  {onOpenPhotosForSegment ? (
                    <SegmentPhotosCue
                      count={countForSegment(media, routeStopSegmentId(i))}
                      onView={() =>
                        onOpenPhotosForSegment(routeStopSegmentId(i))
                      }
                    />
                  ) : null}
                </div>
              </div>
            ))}

            <div className="relative">
              <span className="absolute -left-6 top-3 flex h-8 w-8 -translate-x-[3px] items-center justify-center rounded-full bg-[#14532d] text-white shadow-md ring-2 ring-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
                  <path d="M4 22V4l15 8-15 8" />
                </svg>
              </span>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Destination
                </p>
                <p className="mt-1 text-base font-semibold text-[#0f172a]">
                  {destParts.main}
                </p>
                {destParts.sub ? (
                  <p className="mt-0.5 text-sm text-slate-500">{destParts.sub}</p>
                ) : null}
                {onOpenPhotosForSegment ? (
                  <SegmentPhotosCue
                    count={countForSegment(media, ROUTE_SEGMENT_DESTINATION)}
                    onView={() =>
                      onOpenPhotosForSegment(ROUTE_SEGMENT_DESTINATION)
                    }
                  />
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#14532d]">
          Metrics
        </h2>
        <div className="mt-4 grid gap-3">
          <MetricReadOnly
            icon="pin"
            label="Total distance"
            value={route?.distanceText}
          />
          <MetricReadOnly
            icon="clock"
            label="Estimated time"
            value={route?.durationText}
          />
          <MetricReadOnly
            icon="speed"
            label="Avg speed"
            value={route?.avgSpeedText}
          />
        </div>
      </section>

      {route?.routeNotes ? (
        <section>
          <h3 className="text-sm font-medium text-slate-600">Route notes</h3>
          <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-100 bg-white p-4 text-sm text-[#0f172a] shadow-sm ring-1 ring-black/[0.04]">
            {route.routeNotes}
          </p>
        </section>
      ) : null}

      {onOpenPhotos ? (
        <button
          type="button"
          onClick={onOpenPhotos}
          className="w-full rounded-2xl border-2 border-[#14532d]/30 bg-white py-3 text-sm font-semibold text-[#14532d] transition hover:bg-emerald-50"
        >
          View {photoCount} trip photos
        </button>
      ) : null}
    </>
  );
}

function MetricReadOnly({
  icon,
  label,
  value,
}: {
  icon: "pin" | "clock" | "speed";
  label: string;
  value?: string;
}) {
  const display = value?.trim() || "—";
  const iconSvg =
    icon === "pin" ? (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 21s-8-4.5-8-11a8 8 0 0 1 16 0c0 6.5-8 11-8 11z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ) : icon === "clock" ? (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ) : (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
        <path d="M12 7v3l3 2" />
      </svg>
    );

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#f4f4f0] p-4 ring-1 ring-black/[0.03]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#14532d] shadow-sm">
        {iconSvg}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-[#14532d]">{display}</p>
      </div>
    </div>
  );
}