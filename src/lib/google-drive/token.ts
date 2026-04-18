"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { DRIVE_FILE_SCOPE } from "./constants";

type Cache = { token: string; expiresAt: number };

const STORAGE_KEY = "tripsync_drive_access_v1";

let memory: Cache | null = null;

function readStorage(): Cache | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cache;
    if (typeof c.token !== "string" || typeof c.expiresAt !== "number") {
      return null;
    }
    return c;
  } catch {
    return null;
  }
}

function writeStorage(c: Cache): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* quota / private mode */
  }
}

function effectiveCache(): Cache | null {
  const now = Date.now();
  if (memory && now < memory.expiresAt - 60_000) {
    return memory;
  }
  const stored = readStorage();
  if (stored && now < stored.expiresAt - 60_000) {
    memory = stored;
    return memory;
  }
  return null;
}

export function clearDriveTokenCache() {
  memory = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * After Firebase sign-in with Drive scope (`signInWithPopup` or redirect flow), store the
 * Google OAuth access token so Drive uploads do not open a second consent flow.
 */
export function primeDriveAccessTokenFromSignIn(accessToken: string) {
  const expiresAt = Date.now() + 55 * 60 * 1000;
  memory = { token: accessToken, expiresAt };
  writeStorage(memory);
}

export async function getGoogleDriveAccessToken(
  forceRefresh = false,
): Promise<string> {
  const now = Date.now();
  if (!forceRefresh) {
    const hit = effectiveCache();
    if (hit) {
      return hit.token;
    }
  }

  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_FILE_SCOPE);

  try {
    const result = await signInWithPopup(auth, provider);
    const cred = GoogleAuthProvider.credentialFromResult(result);
    const token = cred?.accessToken;
    if (!token) {
      throw new Error("Google sign-in did not return an access token.");
    }
    memory = {
      token,
      expiresAt: now + 55 * 60 * 1000,
    };
    writeStorage(memory);
    return token;
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code: string }).code)
        : "";
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, provider);
      throw new Error(
        "Redirecting to Google for Drive access. Continue here after signing in.",
      );
    }
    throw e;
  }
}
