"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function Protected({ children }: { children: ReactNode }) {
  const { user, loading, configError, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !configError) {
      router.replace("/login");
    }
  }, [user, loading, configError, router]);

  if (configError) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Firebase is not configured
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add your Firebase web app keys to{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            .env.local
          </code>{" "}
          (see .env.local.example).
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
        >
          Back home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Redirecting to sign in…</p>
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
