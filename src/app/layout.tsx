import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Ripple } from "@/components/m3/core";
import { SnackbarProvider } from "@/components/m3/overlay";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Daily Line — one focus at a time",
    template: "%s · Daily Line",
  },
  description: "Your routine, live. See what you should be doing right now.",
};

export const viewport: Viewport = {
  themeColor: "#0c1116",
  width: "device-width",
  initialScale: 1,
};

/**
 * Applies saved display preferences (theme/contrast/text size/motion)
 * before first paint to avoid flashes.
 */
const themeScript = `(function(){try{
var p=JSON.parse(localStorage.getItem("dl-display")||"{}");
var d=document.documentElement;
var theme=p.theme||"dark";
if(theme==="system"){theme=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}
d.setAttribute("data-theme",theme);
if(p.contrast==="high")d.setAttribute("data-contrast","high");
if(p.text&&p.text!=="normal")d.setAttribute("data-text",p.text);
if(p.motion==="reduced")d.setAttribute("data-motion","reduced");
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SnackbarProvider>{children}</SnackbarProvider>
        <Ripple />
      </body>
    </html>
  );
}
