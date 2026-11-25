import type { Metadata } from "next";
import Downloader from "./downloader";

export const metadata: Metadata = {
  title: "Download a video | Jelle Wijma",
  description: "Save a video from YouTube, Vimeo, or Instagram as MKV or MP4 at its highest available quality, or download the audio as MP3.",
  robots: { index: false, follow: false },
};

export default function DownloadVideoPage() {
  return <Downloader />;
}
