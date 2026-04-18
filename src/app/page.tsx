import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            TripSync
          </span>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/login"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500"
            >
              Open app
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-emerald-50 via-white to-zinc-100 px-8 py-16 text-center dark:border-zinc-800 dark:from-emerald-950/50 dark:via-zinc-900 dark:to-zinc-950 sm:px-12">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
            Group trips, simplified
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Plan together. Ride together. Remember together.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            TripSync brings invites, checklists, manual routes, shared expenses,
            photos, and a live timeline into one place—so your crew spends less
            time switching apps and more time on the road.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/trips/new"
              className="rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
            >
              Create a trip
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-zinc-300 bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Sign in with Google
            </Link>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Everything your group needs
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Trip hub",
                body: "Cover art, dates, and a dashboard built for small groups.",
              },
              {
                title: "Expenses",
                body: "Split costs fairly and see who owes what at a glance.",
              },
              {
                title: "Photos",
                body: "Upload trip memories everyone can browse.",
              },
              {
                title: "Route plan",
                body: "Capture start, destination, stops, and notes—no map API required yet.",
              },
              {
                title: "Checklists",
                body: "Packing and prep with categories and optional assignees.",
              },
              {
                title: "Timeline",
                body: "A single feed for expenses, photos, and joins.",
              },
            ].map((f) => (
              <li
                key={f.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {f.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20 rounded-2xl border border-zinc-200 bg-white px-6 py-12 dark:border-zinc-800 dark:bg-zinc-900 sm:px-10">
          <h2 className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            How it works
          </h2>
          <ol className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-3">
            {[
              "Sign in with Google and create a trip.",
              "Share the invite link so friends join the same space.",
              "Add routes, checklists, expenses, and photos—then follow the timeline.",
            ].map((step, i) => (
              <li key={i} className="text-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 text-center">
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Ready when you are
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Go to dashboard
          </Link>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
        <p>TripSync — trip planning and personalization</p>
      </footer>
    </div>
  );
}
