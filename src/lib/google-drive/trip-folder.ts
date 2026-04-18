"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type { Trip } from "@/types/models";
import {
  addWriterByEmail,
  createTripFolder,
  setAnyoneReader,
} from "./drive-api";
import { getGoogleDriveAccessToken } from "./token";

/** Safe folder name for Google Drive */
export function tripFolderDisplayName(tripName: string, tripId: string): string {
  const base = tripName
    .replace(/[/\\?%*:|"<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const suffix = tripId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 12);
  return `${base || "Trip"}_${suffix}`;
}

/**
 * Ensures `trips/{tripId}` has `driveFolderId`; creates folder + sharing on first use.
 */
export async function ensureTripDriveFolder(
  trip: Trip,
  tripId: string,
  memberEmails: string[],
): Promise<{ folderId: string }> {
  if (trip.driveFolderId) {
    return { folderId: trip.driveFolderId };
  }

  const token = await getGoogleDriveAccessToken();
  const name = tripFolderDisplayName(trip.name, tripId);
  const folder = await createTripFolder(token, name);
  await setAnyoneReader(token, folder.id);

  const uniqueEmails = [...new Set(memberEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  for (const email of uniqueEmails) {
    await addWriterByEmail(token, folder.id, email);
  }

  await updateDoc(doc(getDb(), "trips", tripId), {
    driveFolderId: folder.id,
    driveFolderWebViewLink: folder.webViewLink ?? null,
    updatedAt: serverTimestamp(),
  });

  return { folderId: folder.id };
}
