import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { getDb, listRoutines } from "@/lib/db";
import { ViewTabs } from "./ViewTabs";
import { RoutineMenu, BrandDot } from "./RoutineMenu";
import { UserMenu } from "./UserMenu";

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const db = await getDb();
  const routines = await listRoutines(db, session.user.id);
  const active = routines.find((r) => r.isActive) ?? routines[0];

  return (
    <div className="shell">
      <header className="appbar">
        <div className="appbar-in">
          <Link href="/" className="appbar-title" aria-label="Daily Line home">
            <BrandDot />
            Daily Line
          </Link>
          <RoutineMenu routines={routines} activeId={active?.id ?? ""} />
          <span className="appbar-spacer" />
          <UserMenu name={session.user.name} email={session.user.email} />
        </div>
      </header>
      <ViewTabs />
      <main className="shell-main page-enter" id="main">
        {children}
      </main>
    </div>
  );
}
