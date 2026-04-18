"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const benefits = [
  "Manage trips, members, and invites in one place",
  "Track shared expenses with clear balances",
  "Upload photos and follow a live activity timeline",
];

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
          to{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            .env.local
          </code>{" "}
          and add your Firebase keys.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-emerald-700 underline dark:text-emerald-400"
        >
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-emerald-900 via-emerald-800 to-zinc-900 lg:flex">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        <div className="relative z-10 p-12 text-white">
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-200/90">
            TripSync
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            Your group trip, one workspace
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-100/90">
            Plan routes and checklists before you leave. Split costs and share
            photos while you are out. Catch up on everything in one timeline when
            you are back.
          </p>
        </div>
        <div className="relative z-10 p-12">
          <ul className="space-y-3 text-sm text-emerald-50/95">
            {benefits.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Sign in
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Continue with Google to create trips, join via invite links, and sync
            with your group.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => signInWithGoogle()}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white py-3.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {loading ? "Loading…" : "Continue with Google"}
          </button>
          <p className="mt-6 text-center text-xs text-zinc-500">
            By continuing, you agree to use TripSync according to your
            organization&apos;s policies.
          </p>
          <Link
            href="/"
            className="mt-8 block text-center text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
