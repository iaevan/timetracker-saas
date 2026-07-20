"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/m3/core";

const TABS = [
  { href: "/", label: "Now", icon: "timelapse" },
  { href: "/week", label: "Week", icon: "view_week" },
  { href: "/edit", label: "Edit", icon: "edit_calendar" },
];

export function ViewTabs() {
  const pathname = usePathname();
  return (
    <nav className="m3-tabs" aria-label="Views">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className="m3-tab" aria-current={active ? "page" : undefined} aria-selected={active}>
            <Icon name={t.icon} fill={active} />
            {t.label}
            <span className="m3-tab-ind" aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}
