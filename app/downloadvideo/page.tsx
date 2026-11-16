import type { Metadata } from "next";
import Downloader from "./downloader";

export const metadata: Metadata = {
  title: "Download a YouTube video | Jelle Wijma",
  description: "Save a YouTube video as MP4 or download its audio as MP3.",
  robots: { index: false, follow: false },
};

export default function DownloadVideoPage() {
  return <Downloader />;
}
