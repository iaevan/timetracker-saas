"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WavyProgress } from "@/components/m3/overlay";
import {
  computeState,
  fmtClockMin,
  fmtDur,
  fmtTime,
  type BlockInstance,
  type DayBlock,
} from "@/lib/schedule";
import type { ResolvedBlock } from "@/lib/types";
import { DAY_NAMES } from "@/lib/types";

const SLEEP_COLOR = "#5f6b7a";

function useNow(): Date {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function NowView({
  blocks,
  dayTags,
}: {
  blocks: ResolvedBlock[];
  dayTags: Record<number, string>;
}) {
  const now = useNow();
  const st = useMemo(() => computeState(now, blocks), [now, blocks]);
  const [tip, setTip] = useState<{ key: string; left: number } | null>(null);
  const tipSticky = useRef(false);
  const railRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);
  const lastAnnounced = useRef<string>("");

  // announce current-block changes to screen readers
  useEffect(() => {
    if (!st) return;
    const label = st.current
      ? `Now: ${st.current.block.title}, ${st.current.block.categoryName}, ends ${fmtTime(st.current.end)}`
      : "Off the clock. Nothing scheduled right now.";
    if (label !== lastAnnounced.current) {
      lastAnnounced.current = label;
      if (liveRef.current) liveRef.current.textContent = label;
    }
  }, [st]);

  // dismiss sticky rail tooltip on outside click
  useEffect(() => {
    if (!tip) return;
    const onDoc = (e: PointerEvent) => {
      if (!(e.target as Element).closest(".rail-seg")) setTip(null);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [tip]);

  if (!st) {
    return (
      <div aria-busy="true">
        <div className="skel" style={{ height: "3.5rem", marginBottom: "1rem" }} />
        <div className="skel" style={{ height: "3rem", marginBottom: "2rem" }} />
        <div className="skel" style={{ height: "14rem" }} />
      </div>
    );
  }

  const dow = st.dow;
  const dayName = DAY_NAMES[dow];
  const tag = dayTags[dow] ?? "";
  const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
  const pastMidnight = st.mode === "awake" && st.dayBase.toDateString() !== todayStr;
  const planTomorrow = st.mode === "sleep" && st.next && st.dayBase.toDateString() !== todayStr;

  const current = st.current;
  const heroColor = current ? current.block.categoryColor : SLEEP_COLOR;
  const heroPct = current
    ? Math.max(0, Math.min(1, (now.getTime() - current.start.getTime()) / (current.end.getTime() - current.start.getTime())))
    : 0;

  const showTip = (e: React.SyntheticEvent, bl: DayBlock, sticky: boolean) => {
    const seg = e.currentTarget as HTMLElement;
    const rail = railRef.current;
    if (!rail) return;
    const r = seg.getBoundingClientRect();
    const rr = rail.getBoundingClientRect();
    const center = r.left + r.width / 2 - rr.left;
    const clamped = Math.max(84, Math.min(rr.width - 84, center));
    if (sticky && tip?.key === `${dow}-${bl.index}` && tipSticky.current) {
      setTip(null);
      tipSticky.current = false;
      return;
    }
    tipSticky.current = sticky;
    setTip({ key: `${dow}-${bl.index}`, left: clamped });
  };
  const hideTip = () => {
    if (!tipSticky.current) setTip(null);
  };
  const tipBlock = tip ? st.dayBlocks.find((b) => `${dow}-${b.index}` === tip.key) : null;

  return (
    <div>
      <span ref={liveRef} className="visually-hidden" aria-live="polite" />

      {/* ---- day meta ---- */}
      <div className="daymeta">
        <div>
          <span className="eyebrow">Active day</span>
          <h1 className="dayname">
            {dayName}
            {tag ? <span className="daytag">{tag}</span> : null}
          </h1>
          {pastMidnight ? (
            <span className="midnote">↳ past midnight — still running {dayName}&apos;s plan</span>
          ) : null}
          {planTomorrow ? (
            <span className="midnote">↳ {dayName}&apos;s plan begins after you wake</span>
          ) : null}
        </div>
        <div className="clock tnum">
          {fmtTime(now)}
          <span className="sub">
            {now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
          </span>
        </div>
      </div>

      {/* ---- day rail ---- */}
      {st.dayBlocks.length > 0 ? (
        <div className="rail" ref={railRef}>
          {tipBlock ? (
            <div
              className="rail-tip"
              role="tooltip"
              style={{ left: tip!.left, "--c": tipBlock.block.categoryColor } as React.CSSProperties}
            >
              <div className="tk">
                <span className="sw" />
                {tipBlock.block.categoryName}
              </div>
              <div className="ac">{tipBlock.block.title}</div>
              <div className="tm tnum">
                {fmtClockMin(tipBlock.block.startMin)} – {fmtClockMin(tipBlock.block.endMin)}
                {tipBlock.block.room ? `  ·  ${tipBlock.block.room}` : ""}
              </div>
            </div>
          ) : null}
          <div className="rail-bar" role="group" aria-label="Today timeline">
            {st.dayBlocks.map((bl) => (
              <button
                key={bl.block.id}
                type="button"
                className={`rail-seg${current?.block.id === bl.block.id ? " live" : ""}${now >= bl.end ? " past" : ""}`}
                style={{ width: `${((bl.end.getTime() - bl.start.getTime()) / (st.dayEnd.getTime() - st.dayStart.getTime())) * 100}%`, background: bl.block.categoryColor }}
                aria-label={`${bl.block.categoryName}: ${bl.block.title}, ${fmtClockMin(bl.block.startMin)} to ${fmtClockMin(bl.block.endMin)}`}
                onMouseEnter={(e) => showTip(e, bl, false)}
                onMouseLeave={hideTip}
                onFocus={(e) => showTip(e, bl, false)}
                onBlur={hideTip}
                onClick={(e) => showTip(e, bl, true)}
              />
            ))}
          </div>
          <div className="nowmark" style={{ left: `${st.nowPos * 100}%` }}>
            <span className="bub tnum">{fmtTime(now)}</span>
          </div>
          <div className="railcap">
            <span>{fmtClockMin(st.dayBlocks[0].block.startMin)} · start</span>
            <span>{fmtClockMin(st.dayBlocks[st.dayBlocks.length - 1].block.endMin)} · end</span>
          </div>
        </div>
      ) : null}

      {/* ---- hero ---- */}
      <div className="nowlbl" style={{ "--c": heroColor } as React.CSSProperties}>
        <span className="pip" />
        {current ? "Right now" : "Off the clock"}
      </div>
      <section
        className={`hero${current ? "" : " sleep"}`}
        style={{ "--c": heroColor } as React.CSSProperties}
        aria-label={current ? `Current activity: ${current.block.title}` : "Resting"}
      >
        {current ? (
          <>
            <div className="track">{current.block.categoryName}</div>
            <h2 className="ttl">{current.block.title}</h2>
            {current.block.detail ? <p className="det">{current.block.detail}</p> : null}
            {current.block.room ? <span className="room">Room {current.block.room}</span> : null}
            <div className="foot">
              <span className="rng tnum">
                {fmtTime(current.start)} – {fmtTime(current.end)}
              </span>
              <span className="cd tnum">
                <b>{fmtDur(current.end.getTime() - now.getTime())}</b> left
              </span>
            </div>
            <WavyProgress pct={heroPct} color={heroColor} />
          </>
        ) : (
          <>
            <div className="track">Nothing scheduled</div>
            <h2 className="ttl">{st.dayBlocks.length ? "Rest" : "No plan for today"}</h2>
            <p className="det">
              {st.dayBlocks.length
                ? "Between blocks. Breathe — nothing is due right now."
                : "This day has no blocks yet. Add some in the editor to see your plan here."}
            </p>
            <div className="foot">
              <span className="rng tnum">{st.next ? `Next up · ${fmtTime(st.next.start)}` : ""}</span>
              {st.next ? (
                <span className="cd tnum">
                  next in <b>{fmtDur(st.next.start.getTime() - now.getTime())}</b>
                </span>
              ) : null}
            </div>
          </>
        )}
      </section>

      {/* ---- up next ---- */}
      <h2 className="upttl">Up next</h2>
      <div className="upnext">
        {st.up.length === 0 ? (
          <div className="up">
            <span className="t">—</span>
            <span />
            <div className="nm">
              <b>Nothing more scheduled</b>
            </div>
          </div>
        ) : (
          st.up.map((it: BlockInstance, idx: number) => (
            <div
              key={it.block.id + it.start.toISOString()}
              className={`up${idx === 0 ? " first" : ""}`}
              style={{ "--c": it.block.categoryColor } as React.CSSProperties}
            >
              <span className="t tnum">{fmtTime(it.start)}</span>
              <span className="pip" />
              <div className="nm">
                <b>{it.block.title}</b>
                <span>{it.block.categoryName}</span>
              </div>
              <span className="in">in {fmtDur(it.start.getTime() - now.getTime())}</span>
            </div>
          ))
        )}
      </div>

      <p className="foot-note">
        Days can run past midnight — a block ending after 12:00 AM counts as the same day&apos;s plan.
        Everything updates live.
      </p>
    </div>
  );
}
