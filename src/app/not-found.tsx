import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <h1 className="text-lg font-semibold text-slate-900">找不到这个页面</h1>
      <p className="text-sm text-slate-500">
        可能是 Board 不存在，或者不属于你的账号。
      </p>
      <Link href="/boards" className="text-sm font-medium text-slate-900 underline">
        回到我的 Boards
      </Link>
    </main>
  );
}
