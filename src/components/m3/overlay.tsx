"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon, IconButton } from "./core";

/* ---------- dialog (native <dialog>, M3 expressive motion) ---------- */

export function Dialog({
  open,
  onClose,
  title,
  icon,
  children,
  actions,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: ReactNode;
  actions?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) {
      dlg.classList.add("closing");
      const t = setTimeout(() => {
        dlg.classList.remove("closing");
        dlg.close();
      }, 140);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="m3-dialog"
      style={wide ? { width: "min(44rem, calc(100vw - 2.5rem))" } : undefined}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // scrim click
      }}
    >
      {open ? (
        <>
          <div className="dlg-head">
            {icon ? <Icon name={icon} /> : null}
            <h2>{title}</h2>
            <IconButton icon="close" label="Close dialog" onClick={onClose} />
          </div>
          <div className="dlg-body">{children}</div>
          {actions ? <div className="dlg-actions">{actions}</div> : null}
        </>
      ) : null}
    </dialog>
  );
}

/* ---------- dropdown menu (anchored, closes on outside/Esc) ---------- */

export function Menu({
  anchor,
  open,
  onClose,
  children,
  align = "right",
  labelledBy,
}: {
  anchor: ReactNode;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
  labelledBy?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {anchor}
      {open ? (
        <div
          className="menu"
          role="menu"
          aria-labelledby={labelledBy}
          style={align === "right" ? { right: 0, top: "calc(100% + 0.375rem)" } : { left: 0, top: "calc(100% + 0.375rem)" }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  danger,
  meta,
}: {
  icon?: string;
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  meta?: ReactNode;
}) {
  return (
    <button type="button" role="menuitem" className={`menu-item${danger ? " danger" : ""}`} onClick={onClick}>
      {icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
      {meta ? <span className="meta">{meta}</span> : null}
    </button>
  );
}

/* ---------- snackbar ---------- */

interface Snack {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const SnackContext = createContext<(message: string, opts?: { actionLabel?: string; onAction?: () => void }) => void>(
  () => {},
);

export const useSnackbar = () => useContext(SnackContext);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const idRef = useRef(0);

  const show = useCallback(
    (message: string, opts?: { actionLabel?: string; onAction?: () => void }) => {
      const id = ++idRef.current;
      setSnacks((s) => [...s.slice(-1), { id, message, actionLabel: opts?.actionLabel, onAction: opts?.onAction }]);
      setTimeout(() => {
        setSnacks((s) => s.filter((x) => x.id !== id));
      }, 4200);
    },
    [],
  );

  const dismiss = (id: number) => setSnacks((s) => s.filter((x) => x.id !== id));

  return (
    <SnackContext.Provider value={show}>
      {children}
      <div className="snackbar-zone" aria-live="polite" role="status">
        {snacks.map((s) => (
          <div key={s.id} className="snackbar">
            <span className="msg">{s.message}</span>
            {s.actionLabel ? (
              <button
                type="button"
                onClick={() => {
                  s.onAction?.();
                  dismiss(s.id);
                }}
              >
                {s.actionLabel}
              </button>
            ) : null}
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(s.id)}>
              <Icon name="close" />
            </button>
          </div>
        ))}
      </div>
    </SnackContext.Provider>
  );
}

/* ---------- progress ---------- */

export function LinearProgress({ pct, color }: { pct: number; color?: string }) {
  return (
    <div
      className="lprog"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      style={color ? ({ "--c": color } as React.CSSProperties) : undefined}
    >
      <i style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

/** M3 Expressive wavy linear progress — undulating stroke with slow drift. */
export function WavyProgress({ pct, color }: { pct: number; color?: string }) {
  const id = useId();
  // one sine period every 24px, amplitude ~2.6px, baseline at y=6 (viewBox height 12)
  const wave =
    "M0 6 q 6 -5.2 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0 t 12 0";
  return (
    <div
      className="wprog"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      style={color ? ({ "--c": color } as React.CSSProperties) : undefined}
    >
      <svg viewBox="0 0 600 12" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x="0" y="0" width={600 * pct} height="12" rx="0" style={{ transition: "width 900ms linear" }} />
          </clipPath>
        </defs>
        <path className="trk" d={wave} fill="none" strokeWidth="3.5" strokeLinecap="round" />
        <g clipPath={`url(#${id}-clip)`}>
          <path className="val" d={wave} fill="none" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
