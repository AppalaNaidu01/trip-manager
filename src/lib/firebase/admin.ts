import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

let adminApp: App | undefined;

function initAdmin(): App {
  if (adminApp) return adminApp;
  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Required for server-side join and invite APIs.",
    );
  }
  const serviceAccount = JSON.parse(raw) as Record<string, unknown>;
  adminApp = initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
  });
  return adminApp;
}

export function getAdminAuth() {
  return getAuth(initAdmin());
}

export function getAdminDb() {
  return getFirestore(initAdmin());
}

export { FieldValue };
