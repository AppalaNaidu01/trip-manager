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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-10 text-center">
        <p className="text-lg font-medium text-[#0f172a]">
          Firebase is not configured
        </p>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Add your Firebase web app keys to{" "}
          <code className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-xs text-[#0f172a]">
            .env.local
          </code>{" "}
          (see .env.local.example).
        </p>
        <Link
          href="/"
          className="mt-6 text-sm font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
        >
          Back home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center bg-white p-12">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-10 text-center">
        <p className="text-slate-600">Redirecting to sign in…</p>
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="mt-4 rounded-2xl border border-slate-300/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 hover:bg-slate-50"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
