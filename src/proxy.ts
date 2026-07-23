// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`, and the
// exported function from `middleware` to `proxy` (see
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy). Proxy
// now defaults to the Node.js runtime, so re-exporting the full `auth` here
// (DB + bcrypt included) is fine — this is Auth.js's documented pattern:
// https://authjs.dev/getting-started/session-management/protecting
export { auth as proxy } from "@/auth";

export const config = {
  // Protect /boards (board switcher) and /b/:key (a single board's kanban/list).
  matcher: ["/boards/:path*", "/b/:path*"],
};
