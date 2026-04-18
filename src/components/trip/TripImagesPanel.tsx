"use client";

import { getDb, getFirebaseStorage } from "@/lib/firebase/client";
import type { Trip } from "@/types/models";
import type { User } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;

export function TripImagesPanel({
  tripId,
  trip,
  user,
}: {
  tripId: string;
  trip: Trip;
  user: User | null;
}) {
  const [coverBusy, setCoverBusy] = useState(false);
  const [bgBusy, setBgBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const closed = trip.closed === true;

  async function upload(
    file: File,
    kind: "cover" | "background",
    setBusy: (v: boolean) => void,
  ) {
    if (!user || closed) return;
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr("Image must be 5 MB or smaller.");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const storage = getFirebaseStorage();
      const safe = file.name.replace(/\s+/g, "_");
      const path = `trips/${tripId}/${kind}_${Date.now()}_${safe}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      const db = getDb();
      const field =
        kind === "cover" ? "coverImageUrl" : "backgroundImageUrl";
      await updateDoc(doc(db, "trips", tripId), {
        [field]: url,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function clearField(field: "coverImageUrl" | "backgroundImageUrl") {
    if (!user || closed) return;
    setErr(null);
    try {
      const db = getDb();
      await updateDoc(doc(db, "trips", tripId), {
        [field]: null,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove image");
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Trip look
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Cover appears on cards and the trip header. Background styles the trip
        dashboard.
      </p>
      {err ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {err}
        </p>
      ) : null}
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Cover image
          </p>
          <div className="mt-2 aspect-[16/9] overflow-hidden rounded-lg border border-zinc-200 bg-gradient-to-br from-emerald-100 to-zinc-200 dark:border-zinc-700 dark:from-emerald-950 dark:to-zinc-900">
            {trip.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={trip.coverImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          {!closed && user ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={coverBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void upload(f, "cover", setCoverBusy);
                  }}
                />
                {coverBusy ? "Uploading…" : "Upload / replace"}
              </label>
              {trip.coverImageUrl ? (
                <button
                  type="button"
                  onClick={() => clearField("coverImageUrl")}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Background image
          </p>
          <div className="mt-2 aspect-video overflow-hidden rounded-lg border border-zinc-200 bg-gradient-to-br from-zinc-100 to-zinc-300 dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-950">
            {trip.backgroundImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={trip.backgroundImageUrl}
                alt=""
                className="h-full w-full object-cover opacity-90"
              />
            ) : null}
          </div>
          {!closed && user ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={bgBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void upload(f, "background", setBgBusy);
                  }}
                />
                {bgBusy ? "Uploading…" : "Upload / replace"}
              </label>
              {trip.backgroundImageUrl ? (
                <button
                  type="button"
                  onClick={() => clearField("backgroundImageUrl")}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
