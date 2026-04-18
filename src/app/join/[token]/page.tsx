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
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="font-medium">Firebase is not configured</p>
        <Link href="/" className="mt-4 inline-block text-emerald-700 underline">
          Home
        </Link>
      </div>
    );
  }

  if (lookupError) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-red-600 dark:text-red-400">{lookupError}</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Home
        </Link>
      </div>
    );
  }

  if (tripName === null && !lookupError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-zinc-500">Loading invite…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Join trip
      </h1>
      <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
        You have been invited to <strong>{tripName}</strong>.
      </p>

      {authLoading ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Checking account…
        </p>
      ) : !user ? (
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Sign in with Google to join.
          </p>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Continue with Google
          </button>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-4">
          {joinError ? (
            <p className="text-center text-sm text-red-600 dark:text-red-400">
              {joinError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={joining || !tripId}
            onClick={() => join()}
            className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {joining ? "Joining…" : "Join this trip"}
          </button>
        </div>
      )}

      <Link
        href="/"
        className="mt-10 block text-center text-sm text-zinc-500 hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
