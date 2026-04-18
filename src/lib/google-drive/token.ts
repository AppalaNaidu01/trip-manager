"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { DRIVE_FILE_SCOPE } from "./constants";

type Cache = { token: string; expiresAt: number };

let cache: Cache | null = null;

export function clearDriveTokenCache() {
  cache = null;
}

export async function getGoogleDriveAccessToken(
  forceRefresh = false,
): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cache && now < cache.expiresAt - 60_000) {
    return cache.token;
  }

  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_FILE_SCOPE);

  const result = await signInWithPopup(auth, provider);
  const cred = GoogleAuthProvider.credentialFromResult(result);
  const token = cred?.accessToken;
  if (!token) {
    throw new Error("Google sign-in did not return an access token.");
  }

  cache = {
    token,
    expiresAt: now + 55 * 60 * 1000,
  };
  return token;
}
