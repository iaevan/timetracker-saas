"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@/components/m3/core";
import { Dialog, Menu, MenuItem, useSnackbar } from "@/components/m3/overlay";
import { TextField, SelectField } from "@/components/m3/inputs";
import { createRoutine, deleteRoutine, renameRoutine, setActiveRoutine } from "@/lib/actions";
import type { Routine } from "@/lib/types";

/** Ambient brand dot that slowly cycles the category palette (from the original app). */
export function BrandDot() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((k) => (k + 1) % COLORS.length), 2600);
    return () => clearInterval(t);
  }, []);
  return <span className="appbar-dot" style={{ "--dot-c": COLORS[i] } as React.CSSProperties} aria-hidden="true" />;
}

const COLORS = ["#22d3ee", "#f5a623", "#f472b6", "#a78bfa", "#60a5fa", "#4ade80"];

export function RoutineMenu({ routines, activeId }: { routines: Routine[]; activeId: string }) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"new" | "rename" | "delete" | null>(null);
  const [target, setTarget] = useState<Routine | null>(null);
  const [name, setName] = useState("");
  const [copyFrom, setCopyFrom] = useState<string>("none");
  const [busy, setBusy] = useState(false);
  const snack = useSnackbar();
  const router = useRouter();
  const active = routines.find((r) => r.id === activeId);

  const run = async (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, okMsg: string) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      snack(okMsg);
      setDialog(null);
      router.refresh();
    } else {
      snack(res.error);
    }
  };

  return (
    <>
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        align="left"
        anchor={
          <button
            type="button"
            className="btn btn-outlined btn-sm"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Active routine: ${active?.name ?? "none"}. Open routine switcher`}
          >
            <Icon name="event_note" />
            <span style={{ maxWidth: "10rem", overflow: "hidden", textOverflow: "ellipsis" }}>
              {active?.name ?? "Routine"}
            </span>
            <Icon name="arrow_drop_down" />
          </button>
        }
      >
        <div className="menu-label">Your routines</div>
        {routines.map((r) => (
          <MenuItem
            key={r.id}
            icon={r.id === activeId ? "check_circle" : "circle"}
            onClick={() => {
              setOpen(false);
              if (r.id !== activeId) run(() => setActiveRoutine(r.id), `Switched to “${r.name}”`);
            }}
          >
            {r.name}
          </MenuItem>
        ))}
        <div className="menu-divider" />
        <MenuItem
          icon="add"
          onClick={() => {
            setOpen(false);
            setName("");
            setCopyFrom(activeId);
            setDialog("new");
          }}
        >
          New routine
        </MenuItem>
        <MenuItem
          icon="edit"
          onClick={() => {
            setOpen(false);
            setTarget(active ?? null);
            setName(active?.name ?? "");
            setDialog("rename");
          }}
        >
          Rename current
        </MenuItem>
        <MenuItem
          icon="delete"
          danger
          onClick={() => {
            setOpen(false);
            setTarget(active ?? null);
            setDialog("delete");
          }}
        >
          Delete current
        </MenuItem>
      </Menu>

      {/* new routine */}
      <Dialog
        open={dialog === "new"}
        onClose={() => setDialog(null)}
        title="New routine"
        icon="event_note"
        actions={
          <>
            <Button variant="text" onClick={() => setDialog(null)}>Cancel</Button>
            <Button disabled={busy || !name.trim()} onClick={() => run(() => createRoutine(name, copyFrom === "none" ? null : copyFrom), "Routine created")}>
              Create
            </Button>
          </>
        }
      >
        <TextField label="Routine name" value={name} onChange={(e) => setName(e.target.value)} placeholder=" " autoFocus maxLength={80} support="e.g. Spring semester, Summer break, Ramadan" />
        <SelectField label="Start from" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
          <option value="none">Blank routine</option>
          {routines.map((r) => (
            <option key={r.id} value={r.id}>
              Copy of “{r.name}”
            </option>
          ))}
        </SelectField>
      </Dialog>

      {/* rename */}
      <Dialog
        open={dialog === "rename"}
        onClose={() => setDialog(null)}
        title="Rename routine"
        icon="edit"
        actions={
          <>
            <Button variant="text" onClick={() => setDialog(null)}>Cancel</Button>
            <Button disabled={busy || !name.trim() || !target} onClick={() => target && run(() => renameRoutine(target.id, name), "Renamed")}>
              Save
            </Button>
          </>
        }
      >
        <TextField label="Routine name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={80} />
      </Dialog>

      {/* delete */}
      <Dialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title={`Delete “${target?.name}”?`}
        icon="delete"
        actions={
          <>
            <Button variant="text" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="danger" disabled={busy || !target} onClick={() => target && run(() => deleteRoutine(target.id), "Routine deleted")}>
              Delete
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--on-surface-variant)", font: "var(--body-lg)" }}>
          All categories and time blocks in this routine will be permanently removed. This cannot be undone.
        </p>
      </Dialog>
    </>
  );
}
