import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getDb, getActiveBundle } from "@/lib/db";
import { resolveBlocks } from "@/lib/schedule";
import { WeekView } from "@/components/week/WeekView";

export const metadata: Metadata = { title: "Week" };

export default async function WeekPage() {
  const session = await getSession();
  const db = await getDb();
  const bundle = session?.user ? await getActiveBundle(db, session.user.id) : null;

  if (!bundle) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <h1 style={{ font: "var(--headline-sm-emph)", marginBottom: "0.5rem" }}>No routine yet</h1>
        <p style={{ color: "var(--on-surface-variant)", font: "var(--body-lg)" }}>
          Create a routine from the routine switcher in the top bar to get started.
        </p>
      </div>
    );
  }

  const blocks = resolveBlocks(bundle.blocks, bundle.categories);
  return <WeekView blocks={blocks} categories={bundle.categories} dayTags={bundle.routine.dayTags} />;
}
