import http from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, readdir, lstat, rm, statfs, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOidcVerifier } from './oidc.mjs';

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_HASH = /^[a-f0-9]{10}$/;
const PLATFORM_NAME = { youtube: 'YouTube', vimeo: 'Vimeo' };
const JOB_ID = /^[a-f0-9]{64}$/;
const OWNER = '.downloadvideo-job';
const LEGACY_QUALITIES = [1080, 720, 480, 360];
const HOUR = 3_600_000;

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function parseVideoUrl(value) {
  const invalidLink = 'Enter a link to one YouTube or Vimeo video.';
  if (typeof value !== 'string' || value.length > 2048 || /[\x00-\x1f\x7f]/.test(value)) {
    throw new HttpError(400, invalidLink);
  }
  const input = value.trim();
  const match = /^https?:\/\/([^/?#]+)([^?#]*)/i.exec(input);
  if (!match || input.includes('\\')) throw new HttpError(400, invalidLink);
  let parsed;
  try { parsed = new URL(input); } catch { throw new HttpError(400, invalidLink); }
  const [, authority, rawPath] = match;
  const host = parsed.hostname.toLowerCase();
  if (authority.toLowerCase() !== host) {
    throw new HttpError(400, 'Use a video link without a login or port number.');
  }

  if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
    const player = host === 'player.vimeo.com';
    const pathMatch = player
      ? /^\/video\/([1-9]\d{0,15})\/?$/.exec(rawPath)
      : /^\/([1-9]\d{0,15})(?:\/([a-f0-9]{10}))?\/?$/.exec(rawPath);
    if (!pathMatch) throw new HttpError(400, invalidLink);
    const id = pathMatch[1];
    const hashes = player ? parsed.searchParams.getAll('h') : pathMatch.slice(2).filter(Boolean);
    if (hashes.length > 1 || (hashes.length === 1 && !VIMEO_HASH.test(hashes[0]))) {
      throw new HttpError(400, 'Copy the full Vimeo link and try again.');
    }
    const hashQuery = hashes.length ? `?h=${hashes[0]}` : '';
    return { id, platform: 'vimeo', url: `https://player.vimeo.com/video/${id}${hashQuery}` };
  }

  let id;
  if (['youtu.be', 'www.youtu.be'].includes(host)) {
    id = parsed.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
  } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v');
    else id = parsed.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
  }
  if (!YOUTUBE_ID.test(id ?? '')) throw new HttpError(400, invalidLink);
  return { id, platform: 'youtube', url: `https://www.youtube.com/watch?v=${id}` };
}

function safeText(value, fallback = '', length = 200) {
  return typeof value === 'string' ? Array.from(value.toWellFormed().replace(/[\x00-\x1f\x7f]/g, '').trim()).slice(0, length).join('') || fallback : fallback;
}

function videoResolution(format) {
  if (!format || format.has_drm || format.ext === 'mhtml' ||
      typeof format.vcodec !== 'string' || !format.vcodec || format.vcodec === 'none' ||
      !Number.isFinite(format.height) || format.height <= 0) return null;
  const shortest = Number.isFinite(format.width) && format.width > 0 ? Math.min(format.width, format.height) : format.height;
  return Math.round(shortest) || null;
}

function sizeLabel(bytes) {
  if (bytes >= 1024 ** 3) return `${Number((bytes / 1024 ** 3).toFixed(1))} GB`;
  if (bytes >= 1024 ** 2) return `${Number((bytes / 1024 ** 2).toFixed(1))} MB`;
  if (bytes >= 1024) return `${Number((bytes / 1024).toFixed(1))} KB`;
  return `${bytes} bytes`;
}

function vimeoThumbnail(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.origin === 'https://i.vimeocdn.com' && !url.username && !url.password) return url.href;
  } catch {}
  return null;
}

function publicDownloadError(error, platform) {
  if (error instanceof HttpError) return error.message;
  const detail = `${error.message ?? ''} ${error.stderr ?? ''}`;
  if (platform === 'vimeo' && /\bDRM\b/i.test(detail)) {
    return 'Vimeo only offered protected streams for this download. Try another video or a lower quality.';
  }
  if (platform === 'vimeo' && /\bHTTP(?: Error)? 401\b/i.test(detail)) {
    return 'Vimeo refused the download server’s request. Open the video on Vimeo and look for the Download button.';
  }
  if (/requested format|format.*not available/i.test(detail)) return 'This format is unavailable for this video. Try a lower quality or MP3.';
  if (platform === 'vimeo' && /privacy|password|log[ -]?in|logged[ -]?in|sign in|403|404|forbidden|restricted|unavailable/i.test(detail)) {
    return 'Vimeo could not open this video. Check the link and make sure the video plays without signing in.';
  }
  const name = PLATFORM_NAME[platform];
  if (/sign in|bot|429|403|po token|confirm you/i.test(detail)) {
    return `${name} blocked this request. Try another video or try again later.`;
  }
  if (/unavailable|private video|members.only|not available|removed|age.restricted/i.test(detail)) {
    return `This video is unavailable or restricted. Try a public ${name} video.`;
  }
  return `${name} could not provide this video. Try again later or use another link.`;
}

function json(res, status, value, extra = {}) {
  const body = JSON.stringify(value);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), ...extra });
  res.end(body);
}

async function requestJson(req) {
  if (!(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Send JSON with Content-Type application/json.');
  if (Number(req.headers['content-length']) > 4096) throw new HttpError(413, 'Request is too large.');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 4096) throw new HttpError(413, 'Request is too large.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
    return value;
  } catch { throw new HttpError(400, 'Invalid JSON request.'); }
}

function terminate(child) {
  if (!child || child.exitCode !== null) return;
  try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch {} }
}

export function parseRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) throw new HttpError(416, 'Invalid byte range.');
  let start;
  let end;
  if (!match[1]) {
    const length = Number(match[2]);
    if (!Number.isSafeInteger(length) || length <= 0) throw new HttpError(416, 'Invalid byte range.');
    start = Math.max(0, size - length); end = size - 1;
  } else {
    start = Number(match[1]); end = match[2] ? Number(match[2]) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) throw new HttpError(416, 'Invalid byte range.');
  return { start, end: Math.min(end, size - 1) };
}

function disposition(filename) {
  const clean = Array.from(filename.toWellFormed().replace(/[\x00-\x1f\x7f/\\]/g, '_')).slice(0, 150).join('');
  const ascii = clean.replace(/[^\x20-\x7e]|[";]/g, '_');
  const encoded = encodeURIComponent(clean).replace(/['()*]/g, ch => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

async function directorySize(directory) {
  let total = 0;
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return 0; throw error; }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    try {
      if (entry.isDirectory()) total += await directorySize(target);
      else if (entry.isFile()) total += (await lstat(target)).size;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return total;
}

export async function createDownloader(overrides = {}) {
  const config = {
    apiKey: process.env.DOWNLOADVIDEO_API_KEY,
    host: process.env.HOST || '127.0.0.1', port: Number(process.env.PORT || 8791),
    dataDir: process.env.DATA_DIR || '/home/jelle/.local/share/downloadvideo/jobs',
    publicBaseUrl: process.env.PUBLIC_BASE_URL || 'https://appa.tailf12edd.ts.net/downloadvideo-backend',
    ytdlpBin: process.env.YTDLP_BIN || '/home/jelle/.local/share/downloadvideo/venv/bin/yt-dlp',
    ffmpegDir: process.env.FFMPEG_DIR || '/home/jelle/.local/share/downloadvideo/bin',
    nodeBin: '/home/jelle/.local/bin/node',
    maxActive: 2, maxQueued: 8, maxMetadata: 4, maxDuration: 7200,
    maxOutputBytes: 10 * 1024 ** 3, maxDiskBytes: 40 * 1024 ** 3, minFreeBytes: 2 * 1024 ** 3,
    jobTimeoutMs: 15 * 60_000, metadataTimeoutMs: 45_000,
    ttlMs: HOUR, metadataTtlMs: 10 * 60_000, cleanupIntervalMs: 60_000,
    quotaIntervalMs: 2000, creationsPerHour: 10, maxStdoutBytes: 8 * 1024 ** 2,
    ...overrides,
  };
  if (typeof config.apiKey !== 'string' || config.apiKey.length < 24) throw new Error('DOWNLOADVIDEO_API_KEY must contain at least 24 characters.');
  config.dataDir = path.resolve(config.dataDir);
  config.publicBaseUrl = config.publicBaseUrl.replace(/\/$/, '');
  await mkdir(config.dataDir, { recursive: true, mode: 0o700 });
  if (!(await lstat(config.dataDir)).isDirectory()) throw new Error('DATA_DIR must be a real directory.');
  const keyHash = createHash('sha256').update(config.apiKey).digest();
  const verifyOidc = config.oidcVerifier ?? createOidcVerifier();
  const jobs = new Map();
  const queue = [];
  const metadata = new Map();
  const inFlightMetadata = new Map();
  const rateLimits = new Map();
  const children = new Set();
  const runningTasks = new Set();
  let active = 0;
  let activeMetadata = 0;
  let closed = false;
  let checkingQuota = false;

  // Only remove directories with this service's marker. Never follow symlinks.
  for (const entry of await readdir(config.dataDir, { withFileTypes: true })) {
    if (!JOB_ID.test(entry.name) || !entry.isDirectory()) continue;
    const directory = path.join(config.dataDir, entry.name);
    try {
      if ((await lstat(path.join(directory, OWNER))).isFile()) await rm(directory, { recursive: true, force: true });
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }

  async function isAuthenticated(req) {
    const value = req.headers.authorization;
    if (typeof value !== 'string' || !value.startsWith('Bearer ')) return false;
    const token = value.slice(7);
    if (timingSafeEqual(keyHash, createHash('sha256').update(token).digest())) return true;
    return await verifyOidc(token);
  }

  function commonArgs(platform) {
    const args = ['--ignore-config', '--no-plugin-dirs', '--no-playlist', '--no-cache-dir',
      '--js-runtimes', `node:${config.nodeBin}`, '--ffmpeg-location', config.ffmpegDir,
      '--socket-timeout', '20', '--retries', '2', '--fragment-retries', '2', '--no-warnings'];
    if (platform === 'vimeo') args.push('--use-extractors', 'vimeo');
    return args;
  }

  function runChild(args, { timeout, cwd = config.dataDir, job, onLine, capture = false } = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(config.ytdlpBin, args, {
        cwd, detached: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'],
        env: { PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin', LANG: 'C.UTF-8', HOME: config.dataDir, TMPDIR: cwd },
      });
      children.add(child);
      if (job) job.child = child;
      let stdout = '';
      let lineBuffer = '';
      let stderr = '';
      let failure;
      let stdoutBytes = 0;
      const timer = setTimeout(() => { failure = new HttpError(504, 'The download took too long. Try a shorter video or lower quality.'); terminate(child); }, timeout);
      timer.unref();
      child.stdout.on('data', chunk => {
        stdoutBytes += chunk.length;
        if (capture) {
          if (stdoutBytes > config.maxStdoutBytes) { failure = new HttpError(502, 'The provider returned too much video information. Try another video.'); terminate(child); return; }
          stdout += chunk.toString('utf8');
        }
        if (onLine) {
          lineBuffer += chunk.toString('utf8');
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop();
          if (lineBuffer.length > 128 * 1024) lineBuffer = '';
          for (const line of lines) if (line.length < 128 * 1024) onLine(line);
        }
      });
      child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString('utf8')).slice(-8192); });
      child.on('error', error => { failure = error; });
      child.on('close', code => {
        clearTimeout(timer); children.delete(child);
        if (job) job.child = undefined;
        if (onLine && lineBuffer) onLine(lineBuffer);
        if (failure) reject(failure);
        else if (code !== 0) reject(Object.assign(new Error('Downloader process failed.'), { stderr }));
        else resolve(stdout);
      });
    });
  }

  async function lookup({ id, platform, url }) {
    // An unlisted Vimeo URL must only share cached metadata with the same privacy hash.
    const cached = metadata.get(url);
    if (cached && cached.expires > Date.now()) return cached;
    if (inFlightMetadata.has(url)) return inFlightMetadata.get(url);
    if (activeMetadata >= config.maxMetadata) throw new HttpError(503, 'Video lookup is busy. Try again in a moment.');
    activeMetadata++;
    const task = (async () => {
      let data;
      try {
        const result = await runChild([...commonArgs(platform), '--dump-single-json', '--skip-download', '--no-progress', '--', url], { timeout: config.metadataTimeoutMs, capture: true });
        try { data = JSON.parse(result); } catch { throw new HttpError(502, `${PLATFORM_NAME[platform]} returned invalid video information. Try again later.`); }
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(502, publicDownloadError(error, platform));
      }
      if (!data || data.id !== id || data._type === 'playlist' || data.entries ||
          (platform === 'vimeo' && data.extractor_key !== 'Vimeo')) {
        throw new HttpError(400, `Enter a link to one ${PLATFORM_NAME[platform]} video.`);
      }
      if (data.is_live || ['is_live', 'is_upcoming', 'post_live'].includes(data.live_status)) throw new HttpError(400, 'Live and upcoming videos are not supported.');
      if (!Number.isFinite(data.duration) || data.duration <= 0) throw new HttpError(400, 'This video has no known duration and cannot be downloaded.');
      if (data.duration > config.maxDuration) throw new HttpError(400, 'Choose a video that is two hours or shorter.');
      const formats = Array.isArray(data.formats) ? data.formats.filter(format => videoResolution(format) !== null) : [];
      const qualities = [...new Set(formats.map(videoResolution))].sort((a, b) => b - a);
      const largest = formats.reduce((best, format) => !best || videoResolution(format) > videoResolution(best) ? format : best, null);
      const portrait = Boolean(largest && Number.isFinite(largest.width) && largest.width > 0 && largest.width < largest.height);
      const name = PLATFORM_NAME[platform];
      const info = {
        id, platform, title: safeText(data.title, `${name} video`),
        channel: safeText(data.channel || data.uploader, name), duration: data.duration,
        thumbnail: platform === 'vimeo' ? vimeoThumbnail(data.thumbnail) : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        qualities, bestQuality: qualities[0] ?? null,
      };
      const result = { info, portrait, expires: Date.now() + config.metadataTtlMs };
      metadata.delete(url);
      metadata.set(url, result);
      while (metadata.size > 100) metadata.delete(metadata.keys().next().value);
      return result;
    })();
    inFlightMetadata.set(url, task);
    try { return await task; } finally { activeMetadata--; inFlightMetadata.delete(url); }
  }

  async function checkSpace() {
    const [space, used] = await Promise.all([statfs(config.dataDir), directorySize(config.dataDir)]);
    if (Number(space.bavail) * Number(space.bsize) < config.minFreeBytes || used > config.maxDiskBytes) {
      throw new HttpError(503, 'The download server is low on temporary space. Try again later.');
    }
  }

  async function removeJobFiles(job) {
    if (!job.readers && !job.child) await rm(job.directory, { recursive: true, force: true });
  }

  function view(job) {
    const value = { id: job.id, status: job.status, progress: job.progress, stage: job.stage, title: job.title };
    if (job.status === 'ready') {
      value.filename = job.filename;
      value.downloadUrl = `${config.publicBaseUrl}/files/${job.id}`;
    }
    if (job.status === 'error') value.error = job.error;
    return value;
  }

  async function execute(job) {
    job.status = 'processing'; job.stage = 'Preparing download';
    try {
      await checkSpace();
      if (job.cancelled) throw new HttpError(400, 'Download cancelled.');
      await mkdir(job.directory, { mode: 0o700 });
      await writeFile(path.join(job.directory, OWNER), 'downloadvideo\n', { mode: 0o600, flag: 'wx' });
      const args = [...commonArgs(job.platform), '--no-simulate', '--newline', '--progress', '--progress-delta', '0.5',
        '--progress-template', 'download:__PROGRESS__%(progress)j',
        '--print', 'after_move:__FILE__%(filepath)j', '--max-filesize', `${config.maxOutputBytes}`,
        '--match-filters', `!is_live & duration <= ${config.maxDuration}`,
        '-o', path.join(job.directory, 'video.%(ext)s')];
      // Some Vimeo manifests advertise formats the player cannot actually fetch.
      if (job.platform === 'vimeo') args.push('--check-formats');
      if (job.format === 'mp3') args.push('-f', 'ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '192K');
      else if (job.format === 'best') {
        const dimension = job.portrait ? 'width' : 'height';
        const qualityFilter = job.quality === 'best' ? '' : `[${dimension}<=${job.quality}]`;
        const video = job.platform === 'vimeo' ? 'bv*' : 'bv';
        const fallback = job.platform === 'vimeo' ? 'bv*' : 'b';
        const selection = `${video}${qualityFilter}+ba/${fallback}${qualityFilter}`;
        const resolution = job.quality === 'best' ? 'res' : `res:${job.quality}`;
        args.push('-f', selection, '--format-sort-force', '--format-sort', `${resolution},fps,hdr,lang,quality`,
          '--merge-output-format', 'mkv', '--remux-video', 'mkv');
      } else args.push('-f', `bv[ext=mp4][vcodec^=avc1][height<=${job.quality}]+ba[ext=m4a]/b[ext=mp4][vcodec^=avc1][height<=${job.quality}]`, '--merge-output-format', 'mp4', '--remux-video', 'mp4');
      args.push('--', job.url);
      let finalPath;
      // Cancellation may arrive while the directory and marker are being created.
      if (job.cancelled) throw new HttpError(400, job.error || 'Download cancelled.');
      await runChild(args, { timeout: config.jobTimeoutMs, cwd: job.directory, job, onLine(line) {
        if (line.startsWith('__PROGRESS__')) {
          try {
            const progress = JSON.parse(line.slice(12));
            const downloaded = progress.downloaded_bytes;
            const total = progress.total_bytes || progress.total_bytes_estimate;
            job.progress = Number.isFinite(downloaded) && Number.isFinite(total) && total > 0 ? Math.min(99, Math.max(0, Math.floor(downloaded / total * 100))) : null;
            job.stage = progress.status === 'finished' ? 'Finishing file' : 'Downloading';
          } catch {}
        } else if (line.startsWith('__FILE__')) {
          try { finalPath = JSON.parse(line.slice(8)); } catch {}
        }
      } });
      if (job.cancelled) throw new HttpError(400, job.error || 'Download cancelled.');
      const expected = path.join(job.directory, `video.${job.extension}`);
      if (typeof finalPath !== 'string' || path.resolve(finalPath) !== expected) throw new HttpError(502, 'The video could not be converted to the requested format.');
      const file = await lstat(expected);
      if (!file.isFile() || file.size === 0) throw new HttpError(502, `${PLATFORM_NAME[job.platform]} returned an empty file.`);
      if (file.size > config.maxOutputBytes) throw new HttpError(413, `The file exceeds the ${sizeLabel(config.maxOutputBytes)} download limit. Try a lower quality or shorter video.`);
      for (const entry of await readdir(job.directory)) {
        if (entry !== OWNER && entry !== `video.${job.extension}`) await rm(path.join(job.directory, entry), { recursive: true, force: true });
      }
      if (job.cancelled) throw new HttpError(400, job.error || 'Download cancelled.');
      job.file = expected; job.size = file.size;
      job.filename = `${safeText(job.title, `${PLATFORM_NAME[job.platform]} video`, 100).replace(/[\\/]/g, '_')}.${job.extension}`;
      job.status = 'ready'; job.progress = 100; job.stage = 'Ready to download';
      job.expires = Date.now() + config.ttlMs;
    } catch (error) {
      job.status = 'error'; job.progress = null; job.stage = 'Download stopped';
      job.error = job.cancelled ? job.error || 'Download cancelled.' : publicDownloadError(error, job.platform);
      job.expires = Date.now() + config.ttlMs;
      await removeJobFiles(job).catch(() => {});
    } finally { active--; pump(); }
  }

  function pump() {
    if (closed) return;
    while (active < config.maxActive && queue.length) {
      const job = queue.shift();
      if (job.cancelled) continue;
      active++;
      const task = execute(job);
      runningTasks.add(task);
      task.finally(() => runningTasks.delete(task));
    }
  }

  async function cleanup() {
    const now = Date.now();
    for (const [id, job] of jobs) {
      if (job.expires <= now && !job.readers && !job.child && !['queued', 'processing'].includes(job.status)) {
        await removeJobFiles(job); jobs.delete(id);
      }
    }
    for (const [id, item] of metadata) if (item.expires <= now) metadata.delete(id);
    for (const [client, times] of rateLimits) if (!times.some(time => now - time < HOUR)) rateLimits.delete(client);
  }

  const cleanupTimer = setInterval(() => cleanup().catch(error => console.error('Download cleanup failed:', error.code || error.name)), config.cleanupIntervalMs);
  cleanupTimer.unref();
  const quotaTimer = setInterval(async () => {
    if (checkingQuota || !active) return;
    checkingQuota = true;
    try { await checkSpace(); }
    catch (error) {
      for (const job of jobs.values()) if (job.status === 'processing') {
        job.cancelled = true; job.error = publicDownloadError(error, job.platform); terminate(job.child);
      }
    } finally { checkingQuota = false; }
  }, config.quotaIntervalMs);
  quotaTimer.unref();

  async function serveFile(req, res, id) {
    const job = jobs.get(id);
    if (!job || job.status !== 'ready' || job.expires <= Date.now()) throw new HttpError(404, 'This download has expired. Prepare the video again.');
    let range;
    try { range = parseRange(req.headers.range, job.size); }
    catch (error) { res.setHeader('Content-Range', `bytes */${job.size}`); throw error; }
    const headers = {
      'Content-Type': job.extension === 'mp3' ? 'audio/mpeg' : job.extension === 'mkv' ? 'video/x-matroska' : 'video/mp4',
      'Content-Disposition': disposition(job.filename), 'Accept-Ranges': 'bytes',
      'Content-Length': range ? range.end - range.start + 1 : job.size,
    };
    if (range) headers['Content-Range'] = `bytes ${range.start}-${range.end}/${job.size}`;
    res.writeHead(range ? 206 : 200, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    job.readers++;
    const stream = createReadStream(job.file, range ?? {});
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true; job.readers--;
      if (job.status !== 'ready' || job.expires <= Date.now()) removeJobFiles(job).catch(() => {});
    };
    stream.on('close', finish);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    try {
      let route = new URL(req.url, 'http://localhost').pathname;
      if (route === '/downloadvideo-backend') route = '/';
      else if (route.startsWith('/downloadvideo-backend/')) route = route.slice('/downloadvideo-backend'.length);
      if (route === '/health' && req.method === 'GET') { json(res, 200, { ok: true }); return; }
      const file = route.match(/^\/files\/([a-f0-9]{64})$/);
      if (file && ['GET', 'HEAD'].includes(req.method)) { await serveFile(req, res, file[1]); return; }
      if (!(await isAuthenticated(req))) { json(res, 401, { error: 'Unauthorized.' }); return; }
      if (route === '/info' && req.method === 'POST') {
        const body = await requestJson(req);
        const { info } = await lookup(parseVideoUrl(body.url));
        json(res, 200, info); return;
      }
      if (route === '/jobs' && req.method === 'POST') {
        const body = await requestJson(req);
        const parsed = parseVideoUrl(body.url);
        const validQuality = body.quality === 'best' || (Number.isSafeInteger(body.quality) && body.quality > 0);
        if (!['best', 'mp4', 'mp3'].includes(body.format) || !validQuality || (body.format === 'mp4' && body.quality === 'best')) {
          throw new HttpError(400, 'Choose a video or audio format and a supported quality.');
        }
        const client = safeText(req.headers['x-downloader-client'], req.socket.remoteAddress || 'unknown', 128);
        const now = Date.now();
        const times = (rateLimits.get(client) ?? []).filter(time => now - time < HOUR);
        if (times.length >= config.creationsPerHour) throw new HttpError(429, 'You have reached 10 downloads in an hour. Try again later.');
        if (rateLimits.size >= 10000 && !rateLimits.has(client)) throw new HttpError(503, 'The download server is busy. Try again later.');
        times.push(now); rateLimits.set(client, times);
        if (queue.length >= config.maxQueued) throw new HttpError(503, 'The download queue is full. Try again in a moment.');
        const { info, portrait } = await lookup(parsed);
        if (body.format === 'best' && (info.bestQuality === null || (body.quality !== 'best' && !info.qualities.includes(body.quality)))) {
          throw new HttpError(400, 'This video quality is unavailable. Choose Best available or one of the listed resolutions.');
        }
        const legacyQuality = LEGACY_QUALITIES.includes(body.quality) && (body.quality <= info.bestQuality || (body.quality === 360 && info.bestQuality > 0));
        if (body.format === 'mp4' && !info.qualities.includes(body.quality) && !legacyQuality) throw new HttpError(400, 'This MP4 quality is unavailable. Choose one of the available qualities or audio.');
        if (queue.length >= config.maxQueued || closed) throw new HttpError(503, 'The download queue is full. Try again in a moment.');
        const id = randomBytes(32).toString('hex');
        const job = { id, url: parsed.url, platform: parsed.platform, title: info.title, format: body.format, quality: body.quality,
          extension: body.format === 'best' ? 'mkv' : body.format, portrait,
          directory: path.join(config.dataDir, id), status: 'queued', progress: null, stage: 'Waiting to download',
          readers: 0, expires: Infinity, cancelled: false };
        jobs.set(id, job); queue.push(job); pump(); json(res, 202, { id }); return;
      }
      const match = route.match(/^\/jobs\/([a-f0-9]{64})$/);
      if (match && ['GET', 'DELETE'].includes(req.method)) {
        const job = jobs.get(match[1]);
        if (!job || job.expires <= Date.now()) throw new HttpError(404, 'Download not found or expired.');
        if (req.method === 'GET') json(res, 200, view(job));
        else {
          job.cancelled = true; job.error = 'Download cancelled.'; job.status = 'error'; job.stage = 'Download stopped'; job.progress = null; job.expires = Date.now() + config.ttlMs;
          const index = queue.indexOf(job); if (index >= 0) queue.splice(index, 1);
          terminate(job.child); await removeJobFiles(job); json(res, 200, { ok: true });
        }
        return;
      }
      throw new HttpError(404, 'Not found.');
    } catch (error) {
      if (res.headersSent) { res.destroy(); return; }
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 500) console.error('Download request failed:', error.code || error.name);
      json(res, status, { error: error instanceof HttpError ? error.message : 'The download server could not complete this request.' }, status === 429 ? { 'Retry-After': '3600' } : {});
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5000;
  server.maxRequestsPerSocket = 100;

  return {
    server, config,
    async listen() {
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.port, config.host, resolve); });
      return server.address();
    },
    cleanup,
    async close() {
      closed = true; clearInterval(cleanupTimer); clearInterval(quotaTimer);
      for (const child of children) terminate(child);
      await Promise.allSettled([...runningTasks, ...inFlightMetadata.values()]);
      await new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); });
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = await createDownloader();
  await app.listen();
  console.log(`Download video backend listening on ${app.config.host}:${app.config.port}`);
  const stop = async () => { await app.close(); process.exit(0); };
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
}
