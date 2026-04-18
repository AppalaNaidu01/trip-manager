"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loading, configError, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (configError) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          Firebase is not configured
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Copy{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            .env.local.example
          </code>{" "}
          to <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code>{" "}
          and add your Firebase keys.
        </p>
        <Link href="/" className="mt-6 inline-block text-emerald-700 underline dark:text-emerald-400">
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sign in to TripSync
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Use your Google account to create and join trips.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => signInWithGoogle()}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white py-3 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          {loading ? "Loading…" : "Continue with Google"}
        </button>
        <Link
          href="/"
          className="mt-6 block text-center text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
