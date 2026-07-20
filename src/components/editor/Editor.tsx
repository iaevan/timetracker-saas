"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Fab, Icon, IconButton } from "@/components/m3/core";
import { Dialog, useSnackbar } from "@/components/m3/overlay";
import { InlineEdit, SegmentedGroup, SwatchPicker, TextArea, TextField } from "@/components/m3/inputs";
import {
  createBlock,
  createCategory,
  deleteBlock,
  deleteCategory,
  setDayTag,
  updateBlock,
  updateCategory,
  type BlockInput,
} from "@/lib/actions";
import { fmtClockMin, minToTimeInput, timeInputToMin } from "@/lib/schedule";
import type { ResolvedBlock, RoutineBundle } from "@/lib/types";
import { DAY_NAMES, DAY_ORDER, UNCATEGORIZED } from "@/lib/types";

const DAY_SHORT: Record<number, string> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

/* ================================================================ */

export function Editor({ bundle }: { bundle: RoutineBundle }) {
  const router = useRouter();
  const snack = useSnackbar();
  const [pending, startTransition] = useTransition();
  const [day, setDay] = useState<number>(() => new Date().getDay());
  const [blockDialog, setBlockDialog] = useState<ResolvedBlock | "new" | null>(null);
  const [catsOpen, setCatsOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const blocks = useMemo(() => {
    const byId = new Map(bundle.categories.map((c) => [c.id, c]));
    return bundle.blocks.map((b) => ({
      ...b,
      categoryName: b.categoryId ? (byId.get(b.categoryId)?.name ?? UNCATEGORIZED.name) : UNCATEGORIZED.name,
      categoryColor: b.categoryId ? (byId.get(b.categoryId)?.color ?? UNCATEGORIZED.color) : UNCATEGORIZED.color,
    }));
  }, [bundle]);

  const dayBlocks = useMemo(
    () => blocks.filter((b) => b.dayOfWeek === day).sort((a, z) => a.startMin - z.startMin || a.sortOrder - z.sortOrder),
    [blocks, day],
  );

  const act = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, okMsg: string, after?: () => void) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        snack(okMsg);
        after?.();
        router.refresh();
      } else {
        snack(res.error);
      }
    });
  };

  const onDeleteBlock = (b: ResolvedBlock) => {
    setRemoving(b.id);
    setTimeout(() => {
      act(
        () => deleteBlock(b.id),
        "Block deleted",
        () => setRemoving(null),
      );
    }, 180);
  };

  return (
    <div>
      <div className="row-between" style={{ marginBottom: "0.75rem" }}>
        <h1 style={{ font: "var(--headline-sm-emph)" }}>Edit routine</h1>
        <Button variant="tonal" icon="category" onClick={() => setCatsOpen(true)}>
          Categories
        </Button>
      </div>

      <SegmentedGroup
        label="Day of week"
        value={day}
        onChange={setDay}
        options={DAY_ORDER.map((d) => ({ value: d, label: DAY_SHORT[d], ariaLabel: DAY_NAMES[d] }))}
      />

      <div className="ed-daytag">
        <InlineEdit
          value={bundle.routine.dayTags[day] ?? ""}
          placeholder="Add a day tagline"
          ariaLabel={`Tagline for ${DAY_NAMES[day]}`}
          onSave={(v) => act(() => setDayTag(day, v), "Tagline saved")}
        />
        <span style={{ font: "var(--body-sm)", color: "var(--on-surface-variant)" }}>
          {dayBlocks.length} block{dayBlocks.length === 1 ? "" : "s"} · shown on the Now and Week views
        </span>
      </div>

      {dayBlocks.length === 0 ? (
        <div className="ed-empty">
          <Icon name="event_busy" className="m3-icon" />
          <p style={{ marginTop: "0.5rem" }}>Nothing planned for {DAY_NAMES[day]}.</p>
          <p style={{ font: "var(--body-md)" }}>Tap “Add block” to schedule your first block.</p>
        </div>
      ) : (
        <ul className="ed-blocks list-reset" aria-label={`${DAY_NAMES[day]} blocks`}>
          {dayBlocks.map((b) => (
            <li key={b.id} className={`ed-block${removing === b.id ? " removing" : ""}`} style={{ "--c": b.categoryColor } as React.CSSProperties}>
              <span className="tm tnum">
                {fmtClockMin(b.startMin)}–{fmtClockMin(b.endMin)}
              </span>
              <span className="pip" aria-hidden="true" />
              <div className="nm">
                <b>{b.title}</b>
                <span>
                  {b.categoryName}
                  {b.detail ? ` · ${b.detail}` : ""}
                  {b.room ? ` · ${b.room}` : ""}
                </span>
              </div>
              <div className="acts">
                <IconButton icon="edit" label={`Edit ${b.title}`} onClick={() => setBlockDialog(b)} />
                <IconButton icon="delete" label={`Delete ${b.title}`} onClick={() => onDeleteBlock(b)} disabled={pending} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Fab icon="add" label="Add block" onClick={() => setBlockDialog("new")} />

      <BlockDialog
        key={blockDialog === "new" ? `new-${day}` : (blockDialog?.id ?? "closed")}
        open={blockDialog !== null}
        onClose={() => setBlockDialog(null)}
        day={blockDialog !== null && blockDialog !== "new" ? blockDialog.dayOfWeek : day}
        block={blockDialog === "new" || blockDialog === null ? null : blockDialog}
        bundle={bundle}
        allBlocks={blocks}
        onSubmit={(input, id) =>
          act(
            () => (id ? updateBlock(id, input) : createBlock(input)),
            id ? "Block updated" : "Block added",
            () => setBlockDialog(null),
          )
        }
      />

      <CategoriesDialog
        open={catsOpen}
        onClose={() => setCatsOpen(false)}
        bundle={bundle}
        blocks={blocks}
        act={act}
      />
    </div>
  );
}

/* ================================================================ */

function BlockDialog({
  open,
  onClose,
  day,
  block,
  bundle,
  allBlocks,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  day: number;
  block: ResolvedBlock | null;
  bundle: RoutineBundle;
  allBlocks: ResolvedBlock[];
  onSubmit: (input: BlockInput, id?: string) => void;
}) {
  const [title, setTitle] = useState(block?.title ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(block?.categoryId ?? bundle.categories[0]?.id ?? null);
  const [start, setStart] = useState(minToTimeInput(block?.startMin ?? 480));
  const [end, setEnd] = useState(minToTimeInput(Math.min(block?.endMin ?? 540, 1439)));
  const [detail, setDetail] = useState(block?.detail ?? "");
  const [room, setRoom] = useState(block?.room ?? "");

  const startMin = timeInputToMin(start);
  let endMin = timeInputToMin(end);
  const wraps = endMin <= startMin;
  if (wraps) endMin += 1440;

  const overlaps = allBlocks.filter(
    (b) => b.dayOfWeek === day && b.id !== block?.id && startMin < b.endMin && endMin > b.startMin,
  );

  const save = () => {
    if (!title.trim()) return;
    onSubmit({ dayOfWeek: day, categoryId, title, detail, room, startMin, endMin: timeInputToMin(end) }, block?.id);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={block ? "Edit block" : `Add block · ${DAY_NAMES[day]}`}
      icon={block ? "edit" : "add"}
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!title.trim()} onClick={save}>
            {block ? "Save" : "Add"}
          </Button>
        </>
      }
    >
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus maxLength={120} support="e.g. Deep ML sprint" />
      <div>
        <span className="menu-label" id="cat-pick-label">Category</span>
        <div role="radiogroup" aria-labelledby="cat-pick-label" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button
            type="button"
            role="radio"
            aria-checked={categoryId === null}
            className={`chip${categoryId === null ? " on" : ""}`}
            style={{ "--c": UNCATEGORIZED.color } as React.CSSProperties}
            onClick={() => setCategoryId(null)}
          >
            <span className="dot" />
            Uncategorized
          </button>
          {bundle.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={categoryId === c.id}
              className={`chip${categoryId === c.id ? " on" : ""}`}
              style={{ "--c": c.color } as React.CSSProperties}
              onClick={() => setCategoryId(c.id)}
            >
              <span className="dot" />
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="time-pair">
        <TextField label="Start" type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
        <TextField label="End" type="time" value={end} onChange={(e) => setEnd(e.target.value)} required support={wraps ? "Runs past midnight" : undefined} />
      </div>
      {overlaps.length > 0 ? (
        <p className="ed-warn" role="alert">
          <Icon name="warning" />
          Overlaps {overlaps.map((o) => `“${o.title}”`).join(", ")}
        </p>
      ) : null}
      <TextArea label="Details (optional)" value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={240} support="Shown under the title · use · to separate ideas" />
      <TextField label="Room / location (optional)" value={room} onChange={(e) => setRoom(e.target.value)} maxLength={60} />
    </Dialog>
  );
}

/* ================================================================ */

function CategoriesDialog({
  open,
  onClose,
  bundle,
  blocks,
  act,
}: {
  open: boolean;
  onClose: () => void;
  bundle: RoutineBundle;
  blocks: ResolvedBlock[];
  act: (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, okMsg: string, after?: () => void) => void;
}) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const countByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of blocks) if (b.categoryId) m.set(b.categoryId, (m.get(b.categoryId) ?? 0) + 1);
    return m;
  }, [blocks]);

  const editCat = editing && editing !== "new" ? bundle.categories.find((c) => c.id === editing) : null;
  const deleteCat = confirmDelete ? bundle.categories.find((c) => c.id === confirmDelete) : null;

  return (
    <>
      <Dialog open={open && !editing && !confirmDelete} onClose={onClose} title="Categories" icon="category" wide
        actions={<Button onClick={() => setEditing("new")} icon="add">New category</Button>}
      >
        <ul className="list-reset">
          {bundle.categories.map((c) => (
            <li key={c.id} className="cat-row">
              <span className="cat-swatch" style={{ "--c": c.color } as React.CSSProperties} aria-hidden="true" />
              <div>
                <span className="nm">{c.name}</span>
                <span className="cnt">
                  {countByCat.get(c.id) ?? 0} block{(countByCat.get(c.id) ?? 0) === 1 ? "" : "s"}
                </span>
              </div>
              <div className="acts" style={{ display: "flex" }}>
                <IconButton icon="edit" label={`Edit ${c.name}`} onClick={() => setEditing(c.id)} />
                <IconButton icon="delete" label={`Delete ${c.name}`} onClick={() => setConfirmDelete(c.id)} />
              </div>
            </li>
          ))}
          {bundle.categories.length === 0 ? (
            <p style={{ color: "var(--on-surface-variant)", font: "var(--body-lg)", padding: "1rem 0" }}>
              No categories yet — create one to color-code your blocks.
            </p>
          ) : null}
        </ul>
      </Dialog>

      <CategoryForm
        key={editing ?? "closed"}
        open={editing !== null}
        onClose={() => setEditing(null)}
        category={editCat ?? null}
        onSubmit={(name, color) =>
          act(
            () => (editCat ? updateCategory(editCat.id, name, color) : createCategory(name, color)),
            editCat ? "Category updated" : "Category created",
            () => setEditing(null),
          )
        }
      />

      <Dialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={`Delete “${deleteCat?.name}”?`}
        icon="delete"
        actions={
          <>
            <Button variant="text" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                confirmDelete &&
                act(() => deleteCategory(confirmDelete), "Category deleted", () => setConfirmDelete(null))
              }
            >
              Delete
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--on-surface-variant)", font: "var(--body-lg)" }}>
          {(countByCat.get(confirmDelete ?? "") ?? 0) > 0
            ? `${countByCat.get(confirmDelete ?? "")} block(s) using this category will become “Uncategorized”.`
            : "No blocks use this category."}
        </p>
      </Dialog>
    </>
  );
}

function CategoryForm({
  open,
  onClose,
  category,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  category: { id: string; name: string; color: string } | null;
  onSubmit: (name: string, color: string) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? "#22d3ee");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={category ? "Edit category" : "New category"}
      icon={category ? "edit" : "add"}
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} onClick={() => onSubmit(name, color)}>
            {category ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <TextField label="Category name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={40} support="e.g. Deep work, Health, Commute" />
      <SwatchPicker value={color} onChange={setColor} />
    </Dialog>
  );
}
