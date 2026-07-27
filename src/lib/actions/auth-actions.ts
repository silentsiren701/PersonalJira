"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { credentialsSchema, registerSchema } from "@/lib/validation";

export type FormActionResult = { error: string } | undefined;

export async function registerAction(
  _prevState: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name") ?? undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password, name } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    return { error: "That email is already registered. Try signing in." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    email,
    passwordHash,
    name: name || null,
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/boards",
    });
  } catch (err) {
    // NEXT_REDIRECT is how Auth.js/Next.js signal a successful redirect —
    // it must be rethrown, not swallowed as an error.
    if (isRedirectError(err)) throw err;
    if (err instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Please sign in manually." };
    }
    throw err;
  }
}

export async function loginAction(
  _prevState: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/boards",
    });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    if (err instanceof AuthError) {
      return { error: "Incorrect email or password" };
    }
    throw err;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

function isRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
