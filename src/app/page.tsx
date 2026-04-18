import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            TripSync
          </span>
          <nav className="flex gap-4 text-sm font-medium">
            <Link
              href="/login"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Open app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-4 py-16">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          One place for your group trip
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Coordinate members, split expenses fairly, share photos, and follow
          everything on a single timeline—without juggling five different apps.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Sign in with Google
          </Link>
        </div>
      </main>
    </div>
  );
}
