import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/boards");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">
          Ticket Record
        </h1>
        <p className="mb-6 text-sm text-slate-500">登录你的私人 Ticket 看板</p>
        <LoginForm />
      </div>
    </main>
  );
}
