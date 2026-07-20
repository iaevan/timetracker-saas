"use client";

import { useEffect, useState } from "react";
import { SegmentedGroup, Switch } from "@/components/m3/inputs";
import { Dialog } from "@/components/m3/overlay";

interface DisplayPrefs {
  theme: "dark" | "light" | "system";
  text: "normal" | "large" | "xlarge";
  contrast: "standard" | "high";
  motion: "full" | "reduced";
}

const DEFAULTS: DisplayPrefs = { theme: "dark", text: "normal", contrast: "standard", motion: "full" };

function load(): DisplayPrefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("dl-display") || "{}") };
  } catch {
    return DEFAULTS;
  }
}

function apply(p: DisplayPrefs) {
  const d = document.documentElement;
  let theme = p.theme;
  if (theme === "system") {
    theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  d.setAttribute("data-theme", theme);
  if (p.contrast === "high") d.setAttribute("data-contrast", "high");
  else d.removeAttribute("data-contrast");
  if (p.text !== "normal") d.setAttribute("data-text", p.text);
  else d.removeAttribute("data-text");
  if (p.motion === "reduced") d.setAttribute("data-motion", "reduced");
  else d.removeAttribute("data-motion");
}

export function DisplaySettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prefs, setPrefs] = useState<DisplayPrefs>(DEFAULTS);

  useEffect(() => {
    if (open) setPrefs(load());
  }, [open]);

  const update = (patch: Partial<DisplayPrefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      localStorage.setItem("dl-display", JSON.stringify(next));
      apply(next);
      return next;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="Display & accessibility" icon="accessibility_new">
      <div className="stack">
        <div>
          <span className="menu-label">Theme</span>
          <SegmentedGroup
            label="Theme"
            value={prefs.theme}
            onChange={(theme) => update({ theme })}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
              { value: "system", label: "System" },
            ]}
          />
        </div>
        <div>
          <span className="menu-label">Text size</span>
          <SegmentedGroup
            label="Text size"
            value={prefs.text}
            onChange={(text) => update({ text })}
            options={[
              { value: "normal", label: "Default" },
              { value: "large", label: "Large" },
              { value: "xlarge", label: "Largest" },
            ]}
          />
        </div>
        <div className="row-between">
          <div>
            <div style={{ font: "var(--title-md)" }}>High contrast</div>
            <div style={{ font: "var(--body-sm)", color: "var(--on-surface-variant)" }}>
              Stronger text and borders for low vision
            </div>
          </div>
          <Switch
            label="High contrast"
            checked={prefs.contrast === "high"}
            onChange={(v) => update({ contrast: v ? "high" : "standard" })}
          />
        </div>
        <div className="row-between">
          <div>
            <div style={{ font: "var(--title-md)" }}>Reduce motion</div>
            <div style={{ font: "var(--body-sm)", color: "var(--on-surface-variant)" }}>
              Turns off animations and ripples
            </div>
          </div>
          <Switch
            label="Reduce motion"
            checked={prefs.motion === "reduced"}
            onChange={(v) => update({ motion: v ? "reduced" : "full" })}
          />
        </div>
      </div>
    </Dialog>
  );
}
