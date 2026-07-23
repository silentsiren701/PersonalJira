import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the Auth.js config (no DB access, no bcrypt) — used by
 * `src/middleware.ts`, which runs on the Edge runtime. The full config with
 * the actual Credentials provider lives in `src/auth.ts`.
 */
export default {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isProtectedRoute =
        pathname.startsWith("/boards") || pathname.startsWith("/b");

      if (isProtectedRoute) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;
