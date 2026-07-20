import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDb, getActiveBundle } from "@/lib/db";
import { Editor } from "@/components/editor/Editor";

export const metadata: Metadata = { title: "Edit" };

export default async function EditPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const db = await getDb();
  const bundle = await getActiveBundle(db, session.user.id);

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

  return <Editor bundle={bundle} />;
}
