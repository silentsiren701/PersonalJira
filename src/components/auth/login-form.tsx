"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth-actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "登录中…" : "登录"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        还没有账号？{" "}
        <Link href="/register" className="font-medium text-slate-900 underline">
          注册
        </Link>
      </p>
    </form>
  );
}
