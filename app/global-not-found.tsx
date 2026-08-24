import "../assets/css/tailwind.generated.css";
import "../assets/css/global.css";
import "../styles/globals.css";
import type { Metadata } from "next";
import NotFound from "./not-found";

export const metadata: Metadata = {
  title: "404 | Nothing lives here",
  description: "This address does not exist. Return to the portfolio of Jelle Wijma.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="bg-black text-white overflow-x-hidden scroll-hide">
        <NotFound />
      </body>
    </html>
  );
}
