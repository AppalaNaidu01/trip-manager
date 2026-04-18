import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white px-4 py-16">
      <div className="mx-auto w-full max-w-lg text-slate-800">
        <h1 className="text-2xl font-semibold text-[#0f172a]">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Placeholder page. Replace with your organization&apos;s privacy policy before
          production use.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block text-sm font-medium text-emerald-800 hover:text-emerald-900"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
