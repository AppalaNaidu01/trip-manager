"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { prefersAuthRedirect } from "@/lib/auth-utils";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  clearDriveTokenCache,
  primeDriveAccessTokenFromSignIn,
} from "@/lib/google-drive/token";

type AuthState = {
  user: User | null;
  loading: boolean;
  configError: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const configError = !isFirebaseConfigured();
  const [pending, setPending] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (configError) return;
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setPending(false);
    });
    return () => unsub();
  }, [configError]);

  /** Complete Google redirect sign-in (mobile / popup-blocked) and prime Drive OAuth token. */
  useEffect(() => {
    if (configError) return;
    const auth = getFirebaseAuth();
    void getRedirectResult(auth)
      .then((result) => {
        if (!result) return;
        const cred = GoogleAuthProvider.credentialFromResult(result);
        if (cred?.accessToken) {
          primeDriveAccessTokenFromSignIn(cred.accessToken);
        }
      })
      .catch((err) => {
        console.error("getRedirectResult:", err);
      });
  }, [configError]);

  const loading = pending;

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configError,
      signInWithGoogle: async () => {
        if (configError) return;
        const auth = getFirebaseAuth();
        if (prefersAuthRedirect()) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const cred = GoogleAuthProvider.credentialFromResult(result);
          if (cred?.accessToken) {
            primeDriveAccessTokenFromSignIn(cred.accessToken);
          }
        } catch (e: unknown) {
          const code =
            e && typeof e === "object" && "code" in e
              ? String((e as { code: string }).code)
              : "";
          if (
            code === "auth/popup-blocked" ||
            code === "auth/operation-not-supported-in-this-environment"
          ) {
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw e;
        }
      },
      logOut: async () => {
        if (configError) return;
        clearDriveTokenCache();
        const auth = getFirebaseAuth();
        await signOut(auth);
      },
    }),
    [user, loading, configError],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
