"use client";

import { useId, useState } from "react";
import type { ComponentProps, ReactNode, SelectHTMLAttributes } from "react";
import { Icon } from "./core";

/* ---------- text field (filled style, floating label) ---------- */

interface TextFieldProps extends ComponentProps<"input"> {
  label: string;
  support?: string;
  invalid?: boolean;
}

export function TextField({ label, support, invalid, id, className = "", ...rest }: TextFieldProps) {
  const autoId = useId();
  const fid = id ?? autoId;
  return (
    <div className={`field${invalid ? " invalid" : ""} ${className}`}>
      <div className="field-box">
        <input id={fid} placeholder=" " aria-invalid={invalid || undefined} {...rest} />
      </div>
      <label htmlFor={fid}>{label}</label>
      {support ? <span className="support">{support}</span> : null}
    </div>
  );
}

interface TextAreaProps extends ComponentProps<"textarea"> {
  label: string;
  support?: string;
}

export function TextArea({ label, support, id, className = "", ...rest }: TextAreaProps) {
  const autoId = useId();
  const fid = id ?? autoId;
  return (
    <div className={`field ${className}`}>
      <div className="field-box">
        <textarea id={fid} placeholder=" " rows={2} {...rest} />
      </div>
      <label htmlFor={fid}>{label}</label>
      {support ? <span className="support">{support}</span> : null}
    </div>
  );
}

/* ---------- select ---------- */

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

export function SelectField({ label, children, id, className = "", ...rest }: SelectFieldProps) {
  const autoId = useId();
  const fid = id ?? autoId;
  return (
    <div className={`field ${className}`}>
      <div className="field-box">
        <select id={fid} {...rest}>
          {children}
        </select>
        <Icon name="arrow_drop_down" className="trail" />
      </div>
      <label htmlFor={fid}>{label}</label>
    </div>
  );
}

/* ---------- switch ---------- */

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="switch" aria-label={label}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="track">
        <span className="handle" />
      </span>
    </label>
  );
}

/* ---------- chip ---------- */

export function Chip({
  children,
  pressed,
  onClick,
  color,
  icon,
}: {
  children: ReactNode;
  pressed?: boolean;
  onClick?: () => void;
  color?: string;
  icon?: string;
}) {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={pressed}
      onClick={onClick}
      style={color ? ({ "--c": color } as React.CSSProperties) : undefined}
    >
      {color ? <span className="dot" /> : null}
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

/* ---------- color swatch picker ---------- */

export const SWATCH_PRESETS = [
  "#22d3ee", "#60a5fa", "#818cf8", "#a78bfa", "#c4b5fd",
  "#f472b6", "#fb7185", "#f5a623", "#f0be62", "#a3e635",
  "#4ade80", "#14b8a6", "#94a3b8", "#8b98a8", "#5f6b7a",
];

export function SwatchPicker({
  value,
  onChange,
  label = "Color",
}: {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}) {
  return (
    <div>
      <span className="menu-label" id="swatch-label">{label}</span>
      <div className="swatch-grid" role="group" aria-labelledby="swatch-label">
        {SWATCH_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            className="cat-swatch"
            style={{ "--c": c } as React.CSSProperties}
            aria-pressed={value.toLowerCase() === c.toLowerCase()}
            aria-label={`Color ${c}`}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- segmented button group (M3E button group) ---------- */

export function SegmentedGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; ariaLabel?: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg-group" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="seg-btn"
          aria-pressed={value === o.value}
          aria-label={o.ariaLabel ?? o.label}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- inline editable text (click-to-edit day tag) ---------- */

export function InlineEdit({
  value,
  placeholder,
  onSave,
  ariaLabel,
  className = "",
}: {
  value: string;
  placeholder: string;
  onSave: (v: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <button
        type="button"
        className={`chip ${className}`}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        aria-label={ariaLabel}
      >
        <Icon name="edit" />
        {value || placeholder}
      </button>
    );
  }
  return (
    <div className="field" style={{ minWidth: "14rem" }}>
      <div className="field-box" style={{ minHeight: "2.75rem" }}>
        <input
          autoFocus
          value={draft}
          placeholder={placeholder}
          aria-label={ariaLabel}
          style={{ padding: "0.375rem 0" }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft.trim() !== value) onSave(draft.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
        />
      </div>
    </div>
  );
}
