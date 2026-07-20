"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ---------- global ripple (event-delegated, M3 press feedback) ---------- */

const RIPPLE_SELECTOR =
  ".btn, .icon-btn, .fab, .chip, .seg-btn, .menu-item, .cat-swatch, .switch";

export function Ripple() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active: { el: HTMLElement; rip: HTMLSpanElement } | null = null;

    const spawn = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = (e.target as Element | null)?.closest(RIPPLE_SELECTOR) as HTMLElement | null;
      if (!t || t.getAttribute("aria-disabled") === "true" || (t as HTMLButtonElement).disabled) return;
      const rect = t.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      const rip = document.createElement("span");
      rip.className = "ripple";
      rip.style.width = rip.style.height = `${size}px`;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      rip.style.left = `${x}px`;
      rip.style.top = `${y}px`;
      t.appendChild(rip);
      active?.rip.remove();
      active = { el: t, rip };
    };
    const release = () => {
      if (!active) return;
      const { rip } = active;
      active = null;
      rip.classList.add("out");
      setTimeout(() => rip.remove(), 520);
    };
    document.addEventListener("pointerdown", spawn, { passive: true });
    document.addEventListener("pointerup", release, { passive: true });
    document.addEventListener("pointercancel", release, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", spawn);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
    };
  }, []);
  return null;
}

/* ---------- icon ---------- */

export function Icon({ name, fill, className = "" }: { name: string; fill?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`m3-icon${fill ? " fill" : ""} ${className}`}>
      {name}
    </span>
  );
}

/* ---------- button ---------- */

type ButtonVariant = "filled" | "tonal" | "elevated" | "outlined" | "text" | "danger" | "danger-tonal";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: string;
  block?: boolean;
}

export function Button({
  variant = "filled",
  size = "md",
  icon,
  block,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    "btn",
    variant !== "filled" ? `btn-${variant}` : "btn-filled",
    size === "lg" ? "btn-lg" : size === "sm" ? "btn-sm" : "",
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

/* ---------- icon button ---------- */

interface IconButtonProps extends ComponentProps<"button"> {
  icon: string;
  label: string; // required for a11y
  variant?: "standard" | "tonal" | "outlined";
  pressed?: boolean;
  fill?: boolean;
}

export function IconButton({
  icon,
  label,
  variant = "standard",
  pressed,
  fill,
  className = "",
  ...rest
}: IconButtonProps) {
  const cls = ["icon-btn", variant !== "standard" ? `icon-btn-${variant}` : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={cls} aria-label={label} title={label} aria-pressed={pressed} {...rest}>
      <Icon name={icon} fill={fill ?? pressed} />
    </button>
  );
}

/* ---------- FAB ---------- */

export function Fab({
  icon,
  label,
  onClick,
  extended = true,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  extended?: boolean;
}) {
  return (
    <button type="button" className="fab fab-enter" onClick={onClick} aria-label={label}>
      <Icon name={icon} />
      {extended ? <span className="fab-label">{label}</span> : null}
    </button>
  );
}

/* ---------- link styled as button ---------- */

export function LinkButton({
  href,
  variant = "text",
  icon,
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  icon?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`btn btn-${variant} ${className}`}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Link>
  );
}
