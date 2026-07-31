"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/** Tab order — drives the direction of the shared-axis slide. */
const ORDER = ["/", "/week", "/edit"];

/**
 * M3 shared axis X: navigating to a tab further right slides content in
 * from the right; navigating back slides in from the left. Remounting on
 * pathname change replays the entrance animation for each destination.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevRef = useRef(pathname);
  const from = ORDER.indexOf(prevRef.current);
  const to = ORDER.indexOf(pathname);
  const dir = to < from ? "axis-x-back" : "axis-x-fwd";

  useEffect(() => {
    prevRef.current = pathname;
  }, [pathname]);

  return (
    <div key={pathname} className={dir}>
      {children}
    </div>
  );
}
