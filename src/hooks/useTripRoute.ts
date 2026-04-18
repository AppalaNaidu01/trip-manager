"use client";

import { mapTripRoute } from "@/lib/firestore-map";
import { getDb } from "@/lib/firebase/client";
import type { TripRoute } from "@/types/models";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

const ROUTE_DOC = "summary";

export function useTripRoute(tripId: string | undefined) {
  const [route, setRoute] = useState<TripRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) {
      setRoute(null);
      setLoading(false);
      return;
    }
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
        setRoute(mapTripRoute(tripId, snap.data()));
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [tripId]);

  return { route, routeLoading: loading };
}
