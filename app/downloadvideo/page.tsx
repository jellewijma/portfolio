import type { Metadata } from "next";
import Downloader from "./downloader";

export const metadata: Metadata = {
  title: "Download a YouTube video | Jelle Wijma",
  description: "Save a YouTube video at its highest available quality or download its audio as MP3.",
  robots: { index: false, follow: false },
};

export default function DownloadVideoPage() {
  return <Downloader />;
}
