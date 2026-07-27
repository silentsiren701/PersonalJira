import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the Auth.js config (no DB access, no bcrypt) — used by
 * `src/middleware.ts`, which runs on the Edge runtime. The full config with
 * the actual Credentials provider lives in `src/auth.ts`.
 */
export default {
  // Auth.js only auto-trusts the host in dev / on Vercel. Self-hosted
  // production (and `next start` locally) needs this, otherwise every auth
  // call fails with UntrustedHost. We always deploy behind hosts we control.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  /**
   * App-specific cookie name so a leftover `authjs.session-token` encrypted
   * with an old AUTH_SECRET (or another Auth.js app on localhost) does not
   * spam JWTSessionError / "no matching decryption secret" on every page.
   */
  cookies: {
    sessionToken: {
      name: "tr.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
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
