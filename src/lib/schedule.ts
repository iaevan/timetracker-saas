import type { Block, Category, ResolvedBlock } from "./types";
import { UNCATEGORIZED } from "./types";

/* ---------- formatting ---------- */

export const pad = (n: number) => String(n).padStart(2, "0");

/** Date -> "9:05 AM" */
export function fmtTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const ap = h < 12 ? "AM" : "PM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${pad(m)} ${ap}`;
}

/** minutes-from-midnight -> "9:05a" (wraps past 1440) */
export function fmtClockMin(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mi = m % 60;
  const ap = h < 12 ? "a" : "p";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${pad(mi)}${ap}`;
}

export function fmtDur(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "under 1m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** minutes -> "HH:MM" for <input type="time"> (clamped into a single day) */
export function minToTimeInput(mins: number): string {
  const m = Math.max(0, Math.min(1439, mins));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function timeInputToMin(v: string): number {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/* ---------- schedule engine (ported from the original Daily Line) ---------- */

export interface BlockInstance {
  start: Date;
  end: Date;
  block: ResolvedBlock;
  base: Date; // the calendar day this block's schedule belongs to
  dow: number;
  index: number;
}

export interface DayBlock {
  start: Date;
  end: Date;
  block: ResolvedBlock;
  index: number;
}

export interface NowState {
  instances: BlockInstance[];
  current: BlockInstance | null;
  next: BlockInstance | null;
  mode: "awake" | "sleep";
  dayBase: Date;
  dow: number;
  dayBlocks: DayBlock[];
  dayStart: Date;
  dayEnd: Date;
  nowPos: number; // 0..1 position within the day rail
  up: BlockInstance[];
}

export function resolveBlocks(
  blocks: Block[],
  categories: Category[],
): ResolvedBlock[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return blocks.map((b) => {
    const cat = b.categoryId ? byId.get(b.categoryId) : undefined;
    return {
      ...b,
      categoryName: cat?.name ?? UNCATEGORIZED.name,
      categoryColor: cat?.color ?? UNCATEGORIZED.color,
    };
  });
}

/** Build concrete block instances across yesterday..tomorrow so midnight rollover works. */
export function buildInstances(
  now: Date,
  blocks: ResolvedBlock[],
): BlockInstance[] {
  const byDow = new Map<number, ResolvedBlock[]>();
  for (const b of blocks) {
    const list = byDow.get(b.dayOfWeek) ?? [];
    list.push(b);
    byDow.set(b.dayOfWeek, list);
  }
  const arr: BlockInstance[] = [];
  for (let off = -1; off <= 1; off++) {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
    const dow = base.getDay();
    (byDow.get(dow) ?? []).forEach((b, i) => {
      arr.push({
        start: new Date(base.getTime() + b.startMin * 60000),
        end: new Date(base.getTime() + b.endMin * 60000),
        block: b,
        base,
        dow,
        index: i,
      });
    });
  }
  arr.sort((a, z) => a.start.getTime() - z.start.getTime());
  return arr;
}

export function computeState(now: Date, blocks: ResolvedBlock[]): NowState | null {
  if (blocks.length === 0) return null;
  const instances = buildInstances(now, blocks);
  let current: BlockInstance | null = null;
  let next: BlockInstance | null = null;
  for (const it of instances) {
    if (it.start <= now && now < it.end) {
      current = it;
      break;
    }
  }
  for (const it of instances) {
    if (it.start > now) {
      next = it;
      break;
    }
  }
  const mode = current ? "awake" : "sleep";
  const dayBase = current
    ? current.base
    : next
      ? next.base
      : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = dayBase.getDay();
  const dayStartBase = new Date(dayBase.getFullYear(), dayBase.getMonth(), dayBase.getDate());
  const dayBlocks: DayBlock[] = blocks
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.dayOfWeek === dow)
    .sort((a, z) => a.b.startMin - z.b.startMin || a.b.sortOrder - z.b.sortOrder)
    .map(({ b, i }) => ({
      start: new Date(dayStartBase.getTime() + b.startMin * 60000),
      end: new Date(dayStartBase.getTime() + b.endMin * 60000),
      block: b,
      index: i,
    }));
  const dayStart = dayBlocks[0]?.start ?? dayStartBase;
  const dayEnd = dayBlocks[dayBlocks.length - 1]?.end ?? dayStartBase;
  const nowPos = Math.max(
    0,
    Math.min(1, (now.getTime() - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime() || 1)),
  );
  const up = instances.filter((it) => it.start > now).slice(0, 3);
  return { instances, current, next, mode, dayBase, dow, dayBlocks, dayStart, dayEnd, nowPos, up };
}
