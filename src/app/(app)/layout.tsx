import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppHeader } from "@/components/layout/app-header";
import { getBoardsForUser } from "@/lib/data";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const boards = await getBoardsForUser(session.user.id);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader boards={boards} />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
