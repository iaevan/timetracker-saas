"use client";

import { useEffect, useMemo, useState } from "react";
import { computeState, fmtClockMin } from "@/lib/schedule";
import type { Category, ResolvedBlock } from "@/lib/types";
import { DAY_NAMES, DAY_ORDER } from "@/lib/types";

function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function WeekView({
  blocks,
  categories,
  dayTags,
}: {
  blocks: ResolvedBlock[];
  categories: Category[];
  dayTags: Record<number, string>;
}) {
  const now = useNow();
  const st = useMemo(() => (now ? computeState(now, blocks) : null), [now, blocks]);

  const byDow = useMemo(() => {
    const m = new Map<number, ResolvedBlock[]>();
    for (const b of blocks) {
      const list = m.get(b.dayOfWeek) ?? [];
      list.push(b);
      m.set(b.dayOfWeek, list);
    }
    for (const list of m.values()) list.sort((a, z) => a.startMin - z.startMin || a.sortOrder - z.sortOrder);
    return m;
  }, [blocks]);

  const usedCats = useMemo(() => {
    const used = new Set(blocks.map((b) => b.categoryId).filter(Boolean));
    return categories.filter((c) => used.has(c.id));
  }, [blocks, categories]);

  if (!now) {
    return (
      <div aria-busy="true">
        <div className="skel" style={{ height: "3.5rem", marginBottom: "1.25rem" }} />
        <div className="wk-grid">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skel" style={{ height: "16rem" }} />
          ))}
        </div>
      </div>
    );
  }

  const todayDow = now.getDay();
  const liveBlockId = st?.current?.block.id ?? null;
  const liveDow = st?.current?.dow ?? null;

  return (
    <div>
      <h1 className="visually-hidden">Your week</h1>
      {usedCats.length > 0 ? (
        <div className="legend" aria-label="Category legend">
          {usedCats.map((c) => (
            <span key={c.id} className="lg" style={{ "--c": c.color } as React.CSSProperties}>
              <span className="sw" />
              {c.name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="wk-grid">
        {DAY_ORDER.map((dow) => {
          const dayBlocks = byDow.get(dow) ?? [];
          const isToday = dow === todayDow;
          return (
            <section key={dow} className={`card card-low wk-card${isToday ? " today" : ""}`} aria-label={DAY_NAMES[dow]}>
              <div className="ch">
                <div>
                  <span className="dd">{DAY_NAMES[dow]}</span>
                  {dayTags[dow] ? <span className="tg">{dayTags[dow]}</span> : null}
                </div>
                {isToday ? <span className="wk-badge">Today</span> : null}
              </div>
              {dayBlocks.length === 0 ? (
                <p style={{ color: "var(--on-surface-variant)", font: "var(--body-md)" }}>No blocks</p>
              ) : (
                dayBlocks.map((b) => (
                  <div
                    key={b.id}
                    className={`wk-row${liveBlockId === b.id && liveDow === dow ? " live" : ""}`}
                    style={{ "--c": b.categoryColor } as React.CSSProperties}
                  >
                    <span className="rt tnum">
                      {fmtClockMin(b.startMin)}–{fmtClockMin(b.endMin)}
                    </span>
                    <span className="rb">
                      <b>{b.title}</b>
                      {b.detail ? <small>{b.detail}</small> : null}
                      {b.room ? <span className="rm">{b.room}</span> : null}
                    </span>
                  </div>
                ))
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
