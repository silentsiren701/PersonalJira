import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-500">
        The Board may not exist, or it doesn&apos;t belong to your account.
      </p>
      <Link href="/boards" className="text-sm font-medium text-slate-900 underline">
        Back to My Boards
      </Link>
    </main>
  );
}
