import "../assets/css/tailwind.generated.css";
import "../assets/css/global.css";
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Jelle Wijma | Portfolio",
  description: "Portfolio of Jelle Wijma, a web developer and photographer creating clean interfaces, visual systems, and image-led digital experiences.",
  icons: {
    icon: "/assets/icons/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white overflow-x-hidden scroll-hide">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
