"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getDb } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function JoinTripPage() {
  const params = useParams();
  const token = params.token as string;
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
    configError,
  } = useAuth();
  const router = useRouter();

  const [tripName, setTripName] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || configError) return;
    let cancelled = false;
    (async () => {
      try {
        const db = getDb();
        const snap = await getDoc(doc(db, "inviteLookups", token));
        if (cancelled) return;
        if (!snap.exists()) {
          setLookupError("This invite link is not valid.");
          return;
        }
        const data = snap.data();
        setTripName(String(data.tripName ?? "Trip"));
        setTripId(String(data.tripId ?? ""));
      } catch (e) {
        if (!cancelled) {
          setLookupError(
            e instanceof Error ? e.message : "Could not load invite.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, configError]);

  async function join() {
    if (!user || !token) return;
    setJoining(true);
    setJoinError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ inviteToken: token }),
      });
      const data = (await res.json()) as { error?: string; tripId?: string };
      if (!res.ok) {
        setJoinError(data.error ?? "Could not join trip");
        return;
      }
      if (data.tripId) {
        router.replace(`/trips/${data.tripId}`);
      }
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Could not join trip");
    } finally {
      setJoining(false);
    }
  }

  if (configError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-10 text-center">
        <p className="font-medium text-[#0f172a]">Firebase is not configured</p>
        <Link
          href="/"
          className="mt-4 text-sm font-medium text-emerald-800 underline underline-offset-2"
        >
          Home
        </Link>
      </div>
    );
  }

  if (lookupError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-10 text-center">
        <p className="text-red-600">{lookupError}</p>
        <Link
          href="/"
          className="mt-4 text-sm text-slate-600 underline underline-offset-2"
        >
          Home
        </Link>
      </div>
    );
  }

  if (tripName === null && !lookupError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Loading invite…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Join trip</h1>
        <p className="mt-2 text-slate-600">
          You have been invited to <strong>{tripName}</strong>.
        </p>

        {authLoading ? (
          <p className="mt-8 text-sm text-slate-500">Checking account…</p>
        ) : !user ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-sm text-slate-600">Sign in with Google to join.</p>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="rounded-2xl border border-slate-300/80 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 transition hover:bg-slate-50"
            >
              Continue with Google
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-4">
            {joinError ? (
              <p className="text-sm text-red-600">{joinError}</p>
            ) : null}
            <button
              type="button"
              disabled={joining || !tripId}
              onClick={() => join()}
              className="rounded-2xl bg-emerald-800 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-800/35 transition hover:brightness-110 disabled:opacity-50"
            >
              {joining ? "Joining…" : "Join this trip"}
            </button>
          </div>
        )}

        <Link
          href="/"
          className="mt-10 block text-sm text-slate-500 transition hover:text-slate-800"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
