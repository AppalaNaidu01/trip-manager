import type { TripRoute } from "@/types/models";

/** Firestore value for media tied to the journey start point */
export const ROUTE_SEGMENT_START = "start";
/** Firestore value for media tied to the final destination */
export const ROUTE_SEGMENT_DESTINATION = "destination";

export function routeStopSegmentId(index: number): string {
  return `stop-${index}`;
}

const LEGACY_KEY = "__legacy";

export function mediaGroupKey(routeSegmentId: string | null | undefined): string {
  if (routeSegmentId == null || String(routeSegmentId).trim() === "") {
    return LEGACY_KEY;
  }
  return String(routeSegmentId);
}

function splitMain(s: string): string {
  const t = s.trim();
  if (!t) return "—";
  const parts = t.split(",").map((x) => x.trim()).filter(Boolean);
  return parts[0] ?? t;
}

export type RouteSegmentOption = { id: string; label: string };

/**
 * Selectable route checkpoints for tagging uploads. Order: start, stops, destination.
 * When the route is empty, returns a single “unassigned” option so upload still works.
 */
export function routeSegmentOptionsForUpload(
  route: TripRoute | null,
): RouteSegmentOption[] {
  const opts: RouteSegmentOption[] = [];
  if (route) {
    if (route.startLocation.trim()) {
      opts.push({
        id: ROUTE_SEGMENT_START,
        label: `Start — ${splitMain(route.startLocation)}`,
      });
    }
    route.stops.forEach((stop, i) => {
      const name = stop.name.trim() || `Stop ${i + 1}`;
      opts.push({
        id: routeStopSegmentId(i),
        label: `Stop ${i + 1} — ${name}`,
      });
    });
    if (route.destination.trim()) {
      opts.push({
        id: ROUTE_SEGMENT_DESTINATION,
        label: `Destination — ${splitMain(route.destination)}`,
      });
    }
  }
  if (opts.length === 0) {
    opts.push({
      id: LEGACY_KEY,
      label: "Whole trip (add route details in Route to tag checkpoints)",
    });
  }
  return opts;
}

/** Label for a segment id given current route data (for section headers). */
export function labelForRouteSegmentId(
  segmentId: string,
  route: TripRoute | null,
): string {
  if (segmentId === LEGACY_KEY) {
    return "Not tagged";
  }
  if (segmentId === ROUTE_SEGMENT_START) {
    return route?.startLocation.trim()
      ? `Start — ${splitMain(route.startLocation)}`
      : "Start";
  }
  if (segmentId === ROUTE_SEGMENT_DESTINATION) {
    return route?.destination.trim()
      ? `Destination — ${splitMain(route.destination)}`
      : "Destination";
  }
  const m = /^stop-(\d+)$/.exec(segmentId);
  if (m && route?.stops) {
    const i = Number(m[1]);
    const stop = route.stops[i];
    if (stop) {
      const name = stop.name.trim() || `Stop ${i + 1}`;
      return `Stop ${i + 1} — ${name}`;
    }
  }
  return segmentId;
}

export const ROUTE_SEGMENT_LEGACY_KEY = LEGACY_KEY;

/** Ordered keys for grouping (route order, then legacy). */
export function orderedSegmentKeys(route: TripRoute | null): string[] {
  const opts = routeSegmentOptionsForUpload(route);
  const keys = opts.map((o) => o.id);
  if (!keys.includes(LEGACY_KEY)) {
    keys.push(LEGACY_KEY);
  }
  return keys;
}
