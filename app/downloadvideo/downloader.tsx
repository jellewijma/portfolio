"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import styles from "./downloadvideo.module.css";

type Quality = "best" | number;
type Format = "best" | "mp4" | "mp3";
const formatOptions = [
  { value: "best", label: "MKV", description: "Video and audio", icon: "video" },
  { value: "mp4", label: "MP4", description: "Video and audio", icon: "video" },
  { value: "mp3", label: "MP3", description: "Audio only", icon: "audio" },
] as const;
const platformNames = { youtube: "YouTube", vimeo: "Vimeo", instagram: "Instagram" };
type Video = {
  id: string;
  platform?: keyof typeof platformNames;
  title: string;
  channel: string;
  duration: number | null;
  thumbnail: string | null;
  qualities: number[];
  bestQuality?: number | null;
};
type Job = {
  id: string;
  status: "queued" | "processing" | "ready" | "error";
  progress: number | null;
  stage: string;
  filename?: string;
  downloadUrl?: string;
  error?: string;
};

function hasVideo(video: Video): boolean {
  return video.platform === "instagram" || video.qualities.length > 0;
}

function Icon({ name, className }: { name: "arrow" | "download" | "link" | "check" | "video" | "audio"; className?: string }) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" /></>,
    link: <><path d="m10 13 4-4m-6 6-1.5 1.5a3.54 3.54 0 0 1-5-5L6 7a3.54 3.54 0 0 1 5 0m2 10a3.54 3.54 0 0 0 5 0l4.5-4.5a3.54 3.54 0 0 0-5-5L16 9" transform="translate(0 -1) scale(.94)" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    video: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3V9Z" /></>,
    audio: <><path d="M9 17V5l11-2v12M9 8l11-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="17" cy="16" rx="3" ry="3" /></>,
  };
  return <svg className={className} width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function videoUrl(value: string): string {
  const trimmed = value.trim();
  const input = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try { parsed = new URL(input); }
  catch { throw new Error("Paste a valid video link."); }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Paste a video link starting with https://.");
  const host = parsed.hostname.toLowerCase();
  if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)) {
    // Keep the full URL so the server can validate an unlisted video's privacy hash.
    return input;
  }
  if (["instagram.com", "www.instagram.com", "m.instagram.com"].includes(host)) {
    const post = /^\/(reel|p)\/([A-Za-z0-9_-]{1,32})\/?$/.exec(parsed.pathname);
    if (!post || parsed.username || parsed.password || parsed.port) {
      throw new Error("Paste a link to an Instagram Reel or video post.");
    }
    return `https://www.instagram.com/${post[1]}/${post[2]}/`;
  }
  const parts = parsed.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  if (["youtu.be", "www.youtu.be"].includes(host)) id = parts[0] ?? null;
  if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
    if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
    else if (["shorts", "embed", "live"].includes(parts[0])) id = parts[1] ?? null;
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error("Paste a single video link from YouTube, Vimeo, or Instagram.");
  return `https://www.youtube.com/watch?v=${id}`;
}

function httpsUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : undefined; }
  catch { return undefined; }
}

function durationLabel(seconds: number | null): string {
  if (!seconds || !Number.isFinite(seconds)) return "";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}` : `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function qualityLabel(value: number): string {
  return `${value}p${value === 4320 ? " · 8K" : value === 2160 ? " · 4K" : value === 1440 ? " · QHD" : value === 1080 ? " · Full HD" : value === 720 ? " · HD" : ""}`;
}

async function request<T>(path: string, signal: AbortSignal, body?: object): Promise<T> {
  const response = await fetch(`/downloadvideo/api/${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "The download service could not complete this request. Please try again.");
  if (!result) throw new Error("The download service returned an empty response. Please try again.");
  return result as T;
}

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [video, setVideo] = useState<Video | null>(null);
  const [format, setFormat] = useState<Format>("best");
  const [quality, setQuality] = useState<Quality>("best");
  const [loading, setLoading] = useState<"info" | "job" | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestController = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const busy = loading !== null || cancelling || job?.status === "queued" || job?.status === "processing";

  useEffect(() => () => requestController.current?.abort(), []);
  useEffect(() => { if (video) titleRef.current?.focus(); }, [video]);

  useEffect(() => {
    if (!job?.id || job.status === "ready" || job.status === "error") return;
    const id = job.id;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    let stopped = false;
    async function poll() {
      try {
        const next = await request<Job>(`jobs/${encodeURIComponent(id)}`, controller.signal);
        if (stopped) return;
        failures = 0;
        setJob(next);
        if (next.status === "error") setError(next.error || "This video could not be prepared. Please try another video.");
        if (next.status !== "ready" && next.status !== "error") timer = setTimeout(poll, 1500);
      } catch (caught) {
        if (controller.signal.aborted || stopped) return;
        failures += 1;
        if (failures < 3) timer = setTimeout(poll, 2500);
        else {
          setJob(null);
          setError(caught instanceof Error ? caught.message : "Connection lost. Please try again.");
        }
      }
    }
    poll();
    return () => { stopped = true; controller.abort(); clearTimeout(timer); };
    // A job keeps its polling session as status updates arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id]);

  async function findVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(""); setNotice(""); setJob(null);
    let normalized: string;
    try { normalized = videoUrl(url); }
    catch (caught) { setError((caught as Error).message); inputRef.current?.focus(); return; }
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading("info"); setVideo(null);
    try {
      const result = await request<Video>("info", controller.signal, { url: normalized });
      if (controller.signal.aborted) return;
      const qualities = [...new Set(result.qualities)].filter((value) => Number.isInteger(value) && value > 0).sort((a, b) => b - a);
      const foundVideo = { ...result, qualities };
      setVideo(foundVideo); setSourceUrl(normalized);
      setQuality("best"); setFormat(hasVideo(foundVideo) ? "best" : "mp3");
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Could not find this video. Please try again.");
    } finally { if (!controller.signal.aborted) setLoading(null); }
  }

  async function prepareFile() {
    if (!video || busy) return;
    setError(""); setNotice(""); setJob(null); setLoading("job");
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const result = await request<{ id: string }>("jobs", controller.signal, { url: sourceUrl, format, quality });
      if (!controller.signal.aborted) setJob({ id: result.id, status: "queued", progress: null, stage: "Waiting to start" });
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Could not start the download. Please try again.");
    } finally { if (!controller.signal.aborted) setLoading(null); }
  }

  function reset() {
    requestController.current?.abort();
    setLoading(null); setCancelling(false); setVideo(null); setJob(null); setError(""); setNotice(""); setUrl(""); setSourceUrl("");
    inputRef.current?.focus();
  }

  async function cancelDownload() {
    if (!job?.id || cancelling) return;
    const id = job.id;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setCancelling(true);
    let message = "Download cancelled. You can choose another format or start again.";
    try {
      const response = await fetch(`/downloadvideo/api/jobs/${encodeURIComponent(id)}`, {
        method: "DELETE",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Cancellation failed");
    } catch {
      if (controller.signal.aborted) return;
      message = "Stopped waiting. The server may still be preparing the file.";
    }
    if (controller.signal.aborted) return;
    setCancelling(false); setLoading(null); setJob(null); setError(""); setNotice(message);
  }

  const progress = typeof job?.progress === "number" && Number.isFinite(job.progress) ? Math.min(100, Math.max(0, job.progress)) : null;
  const readyUrl = job?.status === "ready" ? httpsUrl(job.downloadUrl) : undefined;
  const thumbnail = httpsUrl(video?.thumbnail);
  const highestQuality = video?.qualities[0];
  const isVideo = format !== "mp3";
  const formatLabel = format === "best" ? "MKV" : format.toUpperCase();

  return (
    <div className={styles.page}>
      <nav className={styles.nav} aria-label="Main navigation">
        <a href="/" className={styles.wordmark}>JelleWijma</a>
        <a href="/" className={styles.backLink}>Back to portfolio <Icon name="arrow" /></a>
      </nav>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Download a video.</h1>
          <p>Paste a link. Choose video or audio. Save the file.</p>
        </header>

        <section className={styles.tool} aria-label="Video downloader">
          <form onSubmit={findVideo} className={styles.linkForm} aria-busy={loading === "info"}>
            <label htmlFor="video-url">Video link</label>
            <div className={styles.inputRow}>
              <div className={styles.inputWrap}>
                <Icon name="link" />
                <input ref={inputRef} id="video-url" name="url" type="text" inputMode="url" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="Paste a video link" value={url} disabled={busy} required aria-describedby={error ? "download-error url-help" : "url-help"} aria-invalid={Boolean(error && !video)} onChange={(event) => { setUrl(event.target.value); setVideo(null); setJob(null); setError(""); setNotice(""); }} />
              </div>
              <button type="submit" className={styles.primary} disabled={busy || !url.trim()}>
                {loading === "info" ? <><span className={styles.spinner} /> Finding video</> : <>Find video <Icon name="arrow" /></>}
              </button>
            </div>
            <p id="url-help" className={styles.help}>YouTube videos and Shorts, Vimeo videos, and public Instagram Reels or video posts.</p>
            {loading === "info" && <p className={styles.screenReader} role="status">Finding your video.</p>}
          </form>

          {error && <div className={styles.error} id="download-error" role="alert"><p>{error}</p>{video && !busy && <button className={styles.textButton} onClick={() => { setError(""); setJob(null); }}>Try again <Icon name="arrow" /></button>}</div>}
          {notice && <p className={styles.notice} role="status">{notice}</p>}

          {video ? <div className={styles.result}>
            <div className={styles.videoDetails}>
              <div className={styles.thumbnail}>
                {thumbnail ? <img src={thumbnail} alt="" width="320" height="180" /> : <Icon name="video" />}
                {durationLabel(video.duration) && <span className={styles.duration}>{durationLabel(video.duration)}</span>}
              </div>
              <div className={styles.videoText}>
                <h2 ref={titleRef} tabIndex={-1}>{video.title}</h2>
                <p>{video.channel}</p>
                <span className={styles.sourceLabel}>{platformNames[video.platform ?? "youtube"]}</span>
              </div>
              {!busy && <button type="button" className={styles.textButton} onClick={reset}>Change video</button>}
            </div>

            <fieldset className={styles.formatField} disabled={busy || job?.status === "ready"}>
              <legend>Save as</legend>
              <div className={styles.formats}>
                {formatOptions.map(({ value, label, description, icon }) => {
                  const unavailable = value !== "mp3" && !hasVideo(video);
                  return (
                    <label key={value} className={`${styles.formatChoice} ${format === value ? styles.selected : ""} ${unavailable ? styles.unavailable : ""}`}>
                      <input type="radio" name="format" value={value} checked={format === value} disabled={unavailable} onChange={() => { setFormat(value); setJob(null); setError(""); }} />
                      <Icon name={icon} />
                      <span><strong>{label}</strong><small>{description}</small></span>
                      <span className={styles.radioMark} />
                    </label>
                  );
                })}
              </div>
              {isVideo && <>
                <div className={styles.qualityRow}><label htmlFor="video-quality">Video quality</label><select id="video-quality" value={quality} onChange={(event) => setQuality(event.target.value === "best" ? "best" : Number(event.target.value))}>
                  <option value="best">Best available{highestQuality ? ` · ${highestQuality}p` : ""}</option>
                  {video.qualities.map((value) => <option key={value} value={value}>{qualityLabel(value)}</option>)}
                </select></div>
                <p className={styles.help}>The selected video and audio streams are saved without re-encoding.</p>
              </>}
            </fieldset>

            {job?.status === "queued" || job?.status === "processing" ? <div className={styles.progressSection}>
              <div className={styles.progressLabel} role="status"><span><span className={styles.spinner} />{job.stage || "Preparing your file"}</span>{progress !== null && <span>{Math.round(progress)}%</span>}</div>
              {progress !== null && <div className={styles.progressTrack} role="progressbar" aria-label="Download preparation" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ transform: `scaleX(${progress / 100})` }} /></div>}
              <div className={styles.waitRow}><p>You can save the file when it is ready.</p><button className={styles.textButton} disabled={cancelling} onClick={cancelDownload}>{cancelling ? "Cancelling" : "Cancel download"}</button></div>
            </div> : job?.status === "ready" ? <div className={styles.readySection}>
              <p className={styles.readyLabel} role="status"><Icon name="check" /> Your file is ready.</p>
              {readyUrl ? <a href={readyUrl} className={styles.primary} download={job.filename || true}>Save {formatLabel} <Icon name="download" /></a> : <p role="alert">The file link is unavailable. Please prepare the file again.</p>}
              <p className={styles.help}>The download link expires after 1 hour.</p>
              <button type="button" className={styles.textButton} onClick={() => { setJob(null); setError(""); }}>Choose another format <Icon name="arrow" /></button>
            </div> : <div className={styles.actionRow}>
              <p>{isVideo ? quality === "best" ? "Best available video + audio" : `${quality}p video + audio` : "MP3 audio"}</p>
              <button type="button" className={styles.primary} disabled={busy} onClick={prepareFile}>{loading === "job" ? <><span className={styles.spinner} /> Starting</> : <>Prepare {format === "best" ? "video" : formatLabel} <Icon name="download" /></>}</button>
            </div>}
          </div> : !loading && <div className={styles.emptyState}><Icon name="download" /><p>Your video will appear here.</p><span>Start with a video link above.</span></div>}
        </section>
        <p className={styles.footnote}>Up to 2 hours per video · 10 GB per file.<br />Download videos you own or have permission to save.</p>
      </main>
      <footer className={styles.footer}><a href="/">jellewijma.com</a><span>Video downloader</span></footer>
    </div>
  );
}
