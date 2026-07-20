"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/m3/core";
import { Menu, MenuItem } from "@/components/m3/overlay";
import { signOut } from "@/lib/auth-client";
import { DisplaySettings } from "./DisplaySettings";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const router = useRouter();

  return (
    <>
      <Menu
        open={open}
        onClose={() => setOpen(false)}
        anchor={
          <IconButton
            icon="account_circle"
            label={`Account: ${name}`}
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
          />
        }
      >
        <div className="menu-label" style={{ textTransform: "none" }}>
          {name}
          <br />
          <span style={{ opacity: 0.8 }}>{email}</span>
        </div>
        <div className="menu-divider" />
        <MenuItem
          icon="accessibility_new"
          onClick={() => {
            setOpen(false);
            setSettings(true);
          }}
        >
          Display & accessibility
        </MenuItem>
        <MenuItem
          icon="logout"
          onClick={async () => {
            setOpen(false);
            await signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          Sign out
        </MenuItem>
      </Menu>
      <DisplaySettings open={settings} onClose={() => setSettings(false)} />
    </>
  );
}
