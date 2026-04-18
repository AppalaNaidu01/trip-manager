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
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
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

  const loading = pending;

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configError,
      signInWithGoogle: async () => {
        if (configError) return;
        const auth = getFirebaseAuth();
        const result = await signInWithPopup(auth, googleProvider);
        const cred = GoogleAuthProvider.credentialFromResult(result);
        if (cred?.accessToken) {
          primeDriveAccessTokenFromSignIn(cred.accessToken);
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
