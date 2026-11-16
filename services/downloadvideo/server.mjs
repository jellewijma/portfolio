import http from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, readdir, lstat, rm, statfs, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOidcVerifier } from './oidc.mjs';

const ID = /^[A-Za-z0-9_-]{11}$/;
const JOB_ID = /^[a-f0-9]{64}$/;
const OWNER = '.downloadvideo-job';
const QUALITIES = [1080, 720, 480, 360];
const HOUR = 3_600_000;

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function parseYouTubeUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\x00-\x1f\x7f]/.test(value)) {
    throw new HttpError(400, 'Enter a valid YouTube video link.');
  }
  let parsed;
  const input = value.trim();
  try { parsed = new URL(input); } catch { throw new HttpError(400, 'Enter a valid YouTube video link.'); }
  const authority = input.match(/^[a-z]+:\/\/([^/?#]+)/i)?.[1] ?? '';
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || authority.includes(':')) {
    throw new HttpError(400, 'Use a YouTube link without a login or port number.');
  }
  const host = parsed.hostname.toLowerCase();
  let id;
  if (['youtu.be', 'www.youtu.be'].includes(host)) {
    const match = parsed.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/);
    id = match?.[1];
  } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v');
    else id = parsed.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
  }
  if (!ID.test(id ?? '')) throw new HttpError(400, 'Enter a link to one YouTube video.');
  return { id, url: `https://www.youtube.com/watch?v=${id}` };
}

function safeText(value, fallback = '', length = 200) {
  return typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, length) || fallback : fallback;
}

function publicDownloadError(error) {
  if (error instanceof HttpError) return error.message;
  const detail = `${error.message ?? ''} ${error.stderr ?? ''}`;
  if (/sign in|bot|429|403|po token|confirm you/i.test(detail)) {
    return 'YouTube blocked this request. Try another video or try again later.';
  }
  if (/unavailable|private video|members.only|not available|removed|age.restricted/i.test(detail)) {
    return 'This video is unavailable or restricted. Try a public YouTube video.';
  }
  if (/requested format|format.*not available/i.test(detail)) return 'This format is unavailable for this video. Try a lower quality or MP3.';
  return 'YouTube could not provide this video. Try again later or use another link.';
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
  const clean = filename.replace(/[\x00-\x1f\x7f/\\]/g, '_').slice(0, 150);
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
    maxOutputBytes: 1024 ** 3, maxDiskBytes: 4 * 1024 ** 3, minFreeBytes: 1024 ** 3,
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

  function commonArgs() {
    return ['--ignore-config', '--no-plugin-dirs', '--no-playlist', '--no-cache-dir',
      '--js-runtimes', `node:${config.nodeBin}`, '--ffmpeg-location', config.ffmpegDir,
      '--socket-timeout', '20', '--retries', '2', '--fragment-retries', '2', '--no-warnings'];
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
          if (stdoutBytes > config.maxStdoutBytes) { failure = new HttpError(502, 'YouTube returned too much video information. Try another video.'); terminate(child); return; }
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

  async function lookup(input) {
    const parsed = parseYouTubeUrl(input);
    const cached = metadata.get(parsed.id);
    if (cached && cached.expires > Date.now()) return cached.info;
    if (inFlightMetadata.has(parsed.id)) return inFlightMetadata.get(parsed.id);
    if (activeMetadata >= config.maxMetadata) throw new HttpError(503, 'Video lookup is busy. Try again in a moment.');
    activeMetadata++;
    const task = (async () => {
      let data;
      try {
        const result = await runChild([...commonArgs(), '--dump-single-json', '--skip-download', '--no-progress', '--', parsed.url], { timeout: config.metadataTimeoutMs, capture: true });
        try { data = JSON.parse(result); } catch { throw new HttpError(502, 'YouTube returned invalid video information. Try again later.'); }
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(502, publicDownloadError(error));
      }
      if (data.id !== parsed.id || data._type === 'playlist' || data.entries) throw new HttpError(400, 'Enter a link to one YouTube video.');
      if (data.is_live || ['is_live', 'is_upcoming', 'post_live'].includes(data.live_status)) throw new HttpError(400, 'Live and upcoming videos are not supported.');
      if (!Number.isFinite(data.duration) || data.duration <= 0) throw new HttpError(400, 'This video has no known duration and cannot be downloaded.');
      if (data.duration > config.maxDuration) throw new HttpError(400, 'Choose a video that is two hours or shorter.');
      const heights = Array.isArray(data.formats) ? data.formats.filter(format => format.ext === 'mp4' && /^avc1/.test(format.vcodec ?? '') && Number.isFinite(format.height)).map(format => format.height) : [];
      const maxHeight = Math.max(0, ...heights);
      const info = {
        id: parsed.id, title: safeText(data.title, 'YouTube video'),
        channel: safeText(data.channel || data.uploader, 'YouTube'), duration: data.duration,
        thumbnail: `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`,
        qualities: QUALITIES.filter(quality => quality <= maxHeight),
      };
      if (maxHeight > 0 && info.qualities.length === 0) info.qualities.push(360);
      metadata.delete(parsed.id);
      metadata.set(parsed.id, { info, expires: Date.now() + config.metadataTtlMs });
      while (metadata.size > 100) metadata.delete(metadata.keys().next().value);
      return info;
    })();
    inFlightMetadata.set(parsed.id, task);
    try { return await task; } finally { activeMetadata--; inFlightMetadata.delete(parsed.id); }
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
      const args = [...commonArgs(), '--no-simulate', '--newline', '--progress', '--progress-delta', '0.5',
        '--progress-template', 'download:__PROGRESS__%(progress)j',
        '--print', 'after_move:__FILE__%(filepath)j', '--max-filesize', `${config.maxOutputBytes}`,
        '--match-filters', `!is_live & duration <= ${config.maxDuration}`,
        '-o', path.join(job.directory, 'video.%(ext)s')];
      if (job.format === 'mp3') args.push('-f', 'ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '192K');
      else args.push('-f', `bv[ext=mp4][vcodec^=avc1][height<=${job.quality}]+ba[ext=m4a]/b[ext=mp4][vcodec^=avc1][height<=${job.quality}]`, '--merge-output-format', 'mp4', '--remux-video', 'mp4');
      args.push('--', job.url);
      let finalPath;
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
      const expected = path.join(job.directory, `video.${job.format}`);
      if (typeof finalPath !== 'string' || path.resolve(finalPath) !== expected) throw new HttpError(502, 'The video could not be converted to the requested format.');
      const file = await lstat(expected);
      if (!file.isFile() || file.size === 0) throw new HttpError(502, 'YouTube returned an empty file.');
      if (file.size > config.maxOutputBytes) throw new HttpError(413, 'The file exceeds the 1 GB download limit. Try a lower quality or shorter video.');
      for (const entry of await readdir(job.directory)) {
        if (entry !== OWNER && entry !== `video.${job.format}`) await rm(path.join(job.directory, entry), { recursive: true, force: true });
      }
      if (job.cancelled) throw new HttpError(400, job.error || 'Download cancelled.');
      job.file = expected; job.size = file.size;
      job.filename = `${safeText(job.title, 'YouTube video', 100).replace(/[\\/]/g, '_')}.${job.format}`;
      job.status = 'ready'; job.progress = 100; job.stage = 'Ready to download';
      job.expires = Date.now() + config.ttlMs;
    } catch (error) {
      job.status = 'error'; job.progress = null; job.stage = 'Download stopped';
      job.error = job.cancelled ? job.error || 'Download cancelled.' : publicDownloadError(error);
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
        job.cancelled = true; job.error = publicDownloadError(error); terminate(job.child);
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
      'Content-Type': job.format === 'mp3' ? 'audio/mpeg' : 'video/mp4',
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
        const body = await requestJson(req); json(res, 200, await lookup(body.url)); return;
      }
      if (route === '/jobs' && req.method === 'POST') {
        const body = await requestJson(req);
        const parsed = parseYouTubeUrl(body.url);
        if (!['mp4', 'mp3'].includes(body.format) || !QUALITIES.includes(body.quality)) throw new HttpError(400, 'Choose MP4 or MP3 and a supported quality.');
        const client = safeText(req.headers['x-downloader-client'], req.socket.remoteAddress || 'unknown', 128);
        const now = Date.now();
        const times = (rateLimits.get(client) ?? []).filter(time => now - time < HOUR);
        if (times.length >= config.creationsPerHour) throw new HttpError(429, 'You have reached 10 downloads in an hour. Try again later.');
        if (rateLimits.size >= 10000 && !rateLimits.has(client)) throw new HttpError(503, 'The download server is busy. Try again later.');
        times.push(now); rateLimits.set(client, times);
        if (queue.length >= config.maxQueued) throw new HttpError(503, 'The download queue is full. Try again in a moment.');
        const info = await lookup(parsed.url);
        if (body.format === 'mp4' && !info.qualities.includes(body.quality)) throw new HttpError(400, 'This MP4 quality is unavailable. Choose one of the available qualities or MP3.');
        if (queue.length >= config.maxQueued || closed) throw new HttpError(503, 'The download queue is full. Try again in a moment.');
        const id = randomBytes(32).toString('hex');
        const job = { id, url: parsed.url, title: info.title, format: body.format, quality: body.quality,
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
