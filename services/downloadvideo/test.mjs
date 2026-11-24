import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createDownloader, parseVideoUrl, parseRange } from './server.mjs';

const KEY = 'a-local-test-key-with-at-least-24-characters';
const VIDEO = 'jNQXAC9IVRw';
const VIMEO_VIDEO = '22439234';
const VIMEO_UNLISTED = '123456789';
const VIMEO_HASH = '123abc456d';
const VIMEO_DRM = '76979871';
const VIMEO_DENIED = '1216966772';
const url = id => `https://www.youtube.com/watch?v=${id}`;
const vimeoPlayer = id => `https://player.vimeo.com/video/${id}`;

async function fixture(t, options = {}, prepare) {
  const root = await mkdtemp(path.join(tmpdir(), 'downloadvideo-test-'));
  const dataDir = path.join(root, 'jobs');
  const log = path.join(root, 'calls.jsonl');
  const executable = path.join(root, 'fake-yt-dlp');
  await mkdir(dataDir);
  await writeFile(executable, `#!${process.execPath}
import fs from 'node:fs';
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + '\\n');
const source = new URL(args.at(-1));
const vimeo = source.hostname === 'player.vimeo.com';
const id = vimeo ? source.pathname.split('/').at(-1) : source.searchParams.get('v');
if (args.includes('--dump-single-json')) {
  if (vimeo) {
    if (id === '${VIMEO_DENIED}') {
      process.stderr.write('Unable to download webpage: HTTP Error 401: Unauthorized');
      process.exit(1);
    }
    const unlisted = id === '${VIMEO_UNLISTED}';
    if (unlisted && source.searchParams.get('h') !== '${VIMEO_HASH}') {
      process.stderr.write('Vimeo rejected the privacy settings for ' + source.href);
      process.exit(1);
    }
    process.stdout.write(JSON.stringify({
      id, extractor_key: id === '1234' ? 'Generic' : 'Vimeo', title: unlisted ? 'Unlisted Vimeo video' : 'Vimeo video',
      uploader: 'Vimeo creator', duration: 60,
      thumbnail: unlisted ? 'https://i.vimeocdn.com.example.test/private' : 'https://i.vimeocdn.com/video/123.jpg',
      formats: [720,2160].map(height => ({ext:'mp4',vcodec:'avc1',acodec:'aac',width:Math.round(height*16/9),height})),
    }));
    process.exit(0);
  }
  const formats = id === 'GGGGGGGGGGG' ? [
    {ext:'mp4',vcodec:'avc1.640028',width:1280,height:720},
    {ext:'webm',vcodec:'vp9',width:1920,height:1080},
    {ext:'mp4',vcodec:'av01.0.12M.10',width:3840,height:2160},
    {ext:'webm',vcodec:'vp9',width:7680,height:4320},
    {ext:'mp4',vcodec:'av01.0.12M.10',width:7680,height:4320},
    {ext:'mp4',vcodec:'av01',width:15360,height:8640,has_drm:true},
    {ext:'mhtml',vcodec:'images',width:20000,height:10000},
    {ext:'m4a',vcodec:'none',width:20000,height:10000},
    {ext:'mp4',vcodec:null,width:20000,height:10000}
  ] : id === 'HHHHHHHHHHH' ? [360,720,1080,2160].map(width => ({ext:'webm',vcodec:'vp9',width,height:Math.round(width*16/9)}))
    : id === 'IIIIIIIIIII' ? [{ext:'mp4',vcodec:'avc1',width:320,height:240}]
    : id === 'JJJJJJJJJJJ' ? [{ext:'m4a',vcodec:'none',height:1080}]
    : [360,480,720,1080].map(height => ({ext:'mp4',vcodec:'avc1.640028',width:Math.round(height*16/9),height}));
  process.stdout.write(JSON.stringify({id, title: id === 'FFFFFFFFFFF' ? 'a'.repeat(99) + '😀' : 'Café / video', channel:'Test channel', duration: id === 'AAAAAAAAAAA' ? 7201 : 60,
    is_live:id === 'BBBBBBBBBBB', formats,
    thumbnail:'http://127.0.0.1/private', secret:'do not return', formats_extra:['irrelevant']}));
} else {
  if (id === 'EEEEEEEEEEE') { process.stderr.write('Sign in to confirm you are not a bot'); process.exit(1); }
  if (id === '${VIMEO_DRM}') { process.stderr.write('This format is DRM protected. Requested format is not available'); process.exit(1); }
  const ext = args.includes('-x') ? 'mp3' : args[args.indexOf('--remux-video')+1] === 'mkv' ? 'mkv' : 'mp4';
  const filename = args[args.indexOf('-o')+1].replace('%(ext)s', ext);
  process.stdout.write('__PROGRESS__' + JSON.stringify({status:'downloading', downloaded_bytes:5,total_bytes:15}) + '\\n');
  setTimeout(() => {
    fs.writeFileSync(filename, '0123456789video');
    process.stdout.write('__FILE__' + JSON.stringify(filename) + '\\n');
  }, id === 'CCCCCCCCCCC' || id === 'DDDDDDDDDDD' ? 2000 : 15);
}
`, { mode: 0o700 });
  if (prepare) await prepare(dataDir);
  const app = await createDownloader({ apiKey: KEY, host: '127.0.0.1', port: 0,
    dataDir, ytdlpBin: executable, ffmpegDir: root, oidcVerifier: async () => false,
    minFreeBytes: 0, cleanupIntervalMs: 60_000, quotaIntervalMs: 50,
    ...options });
  const address = await app.listen();
  const base = `http://127.0.0.1:${address.port}`;
  const request = (route, options = {}) => fetch(base + route, {
    ...options, headers: { Authorization: `Bearer ${KEY}`, ...options.headers },
  });
  const post = (route, value, options = {}) => request(route, { method: 'POST', body: JSON.stringify(value), ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers } });
  t.after(async () => { await app.close(); await rm(root, { recursive: true, force: true }); });
  return { app, base, request, post, dataDir, log };
}

async function waitFor(request, id, desired = ['ready', 'error']) {
  const end = Date.now() + 5000;
  while (Date.now() < end) {
    const result = await request(`/jobs/${id}`);
    const value = await result.json();
    if (desired.includes(value.status)) return value;
    await delay(15);
  }
  assert.fail('Job did not reach the requested state.');
}

async function waitForEmptyDirectory(directory) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    if ((await readdir(directory)).length === 0) return;
    await delay(15);
  }
  assert.deepEqual(await readdir(directory), [], 'Temporary files should be removed after the job ends.');
}

test('YouTube links canonicalize and reject arbitrary hosts, schemes, ports and playlists', () => {
  for (const input of [url(VIDEO), `https://youtu.be/${VIDEO}?si=anything`, `https://m.youtube.com/shorts/${VIDEO}`, `http://youtube.com/watch?v=${VIDEO}&list=ignored`]) {
    assert.deepEqual(parseVideoUrl(input), { id: VIDEO, platform: 'youtube', url: url(VIDEO) });
  }
  for (const input of [undefined, 'file:///etc/passwd', 'https://youtube.com.attacker.test/watch?v=' + VIDEO,
    `https://youtube.com@127.0.0.1/watch?v=${VIDEO}`, `https://user@youtube.com/watch?v=${VIDEO}`,
    `https://youtube.com:443/watch?v=${VIDEO}`, `ftp://youtube.com/watch?v=${VIDEO}`,
    'https://youtube.com/playlist?list=PLanything', 'https://youtube.com/watch?v=../../etc/passwd',
    `https://youtu.be/${VIDEO}/extra`, 'https://127.0.0.1/watch?v=' + VIDEO]) {
    assert.throws(() => parseVideoUrl(input), { status: 400 }, String(input));
  }
});

test('Vimeo keeps the privacy hash and only accepts recognized single-video links', () => {
  for (const input of [`https://vimeo.com/${VIMEO_VIDEO}?share=copy`, `http://www.vimeo.com/${VIMEO_VIDEO}/`, `${vimeoPlayer(VIMEO_VIDEO)}?autoplay=1`]) {
    assert.deepEqual(parseVideoUrl(input), { id: VIMEO_VIDEO, platform: 'vimeo', url: vimeoPlayer(VIMEO_VIDEO) });
  }
  const privatePlayer = `${vimeoPlayer(VIMEO_UNLISTED)}?h=${VIMEO_HASH}`;
  for (const input of [`https://vimeo.com/${VIMEO_UNLISTED}/${VIMEO_HASH}?share=copy`, `${privatePlayer}&autoplay=1`]) {
    assert.deepEqual(parseVideoUrl(input), { id: VIMEO_UNLISTED, platform: 'vimeo', url: privatePlayer });
  }
  for (const input of [
    `https://vimeo.com.example.test/${VIMEO_VIDEO}`, `https://user@vimeo.com/${VIMEO_VIDEO}`,
    `https://player.vimeo.com:443/video/${VIMEO_VIDEO}`, `https://vimeo.com/../${VIMEO_VIDEO}`,
    `https://vimeo.com/showcase/${VIMEO_VIDEO}`, `https://vimeo.com/${VIMEO_VIDEO}/unknown`,
    `${vimeoPlayer(VIMEO_VIDEO)}?h=bad`, `${privatePlayer}&h=987abc654d`,
  ]) {
    assert.throws(() => parseVideoUrl(input), { status: 400 }, input);
  }
});

test('byte ranges support offsets and suffixes, and reject malformed ranges', () => {
  assert.deepEqual(parseRange('bytes=2-5', 10), { start: 2, end: 5 });
  assert.deepEqual(parseRange('bytes=-3', 10), { start: 7, end: 9 });
  assert.deepEqual(parseRange('bytes=4-', 10), { start: 4, end: 9 });
  assert.deepEqual(parseRange('bytes=4-100', 10), { start: 4, end: 9 });
  for (const value of ['bytes=20-30', 'bytes=5-4', 'bytes=-0', 'bytes=0-1,4-5', 'bytes=-', 'cats=0-1']) assert.throws(() => parseRange(value, 10), { status: 416 });
});

test('HTTP health is public; API auth, prefix handling, JSON and body limits are enforced', async t => {
  const { base, request, post } = await fixture(t);
  assert.deepEqual(await (await fetch(base + '/downloadvideo-backend/health')).json(), { ok: true });
  assert.equal((await fetch(base + '/jobs/anything')).status, 401);
  assert.equal((await request('/jobs/anything', { headers: { Authorization: 'Bearer wrong' } })).status, 401);
  assert.equal((await request('/info', { method: 'POST', body: '{}' })).status, 415);
  assert.equal((await post('/info', { url: 'x'.repeat(5000) })).status, 413);
  const valid = await post('/downloadvideo-backend/info', { url: url(VIDEO) });
  assert.equal(valid.status, 200);
});

test('metadata is bounded, cached, uses safe thumbnails, and rejects live/long videos', async t => {
  const { post, log } = await fixture(t);
  const first = await (await post('/info', { url: url(VIDEO) })).json();
  assert.deepEqual(Object.keys(first).sort(), ['bestQuality', 'channel', 'duration', 'id', 'platform', 'qualities', 'thumbnail', 'title']);
  assert.equal(first.platform, 'youtube');
  assert.equal(first.thumbnail, `https://i.ytimg.com/vi/${VIDEO}/hqdefault.jpg`);
  assert.deepEqual(first.qualities, [1080, 720, 480, 360]);
  assert.equal(first.bestQuality, 1080);
  assert.equal((await post('/info', { url: `https://youtu.be/${VIDEO}` })).status, 200);
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].at(-1), url(VIDEO));
  assert.equal((await post('/info', { url: url('AAAAAAAAAAA') })).status, 400);
  assert.equal((await post('/info', { url: url('BBBBBBBBBBB') })).status, 400);
});

test('Vimeo metadata verifies the extractor and isolates unlisted links by privacy hash', async t => {
  const { post, log } = await fixture(t);
  const source = `https://vimeo.com/${VIMEO_UNLISTED}/${VIMEO_HASH}`;
  const response = await post('/info', { url: source });
  assert.equal(response.status, 200);
  const info = await response.json();
  assert.equal(info.platform, 'vimeo');
  assert.deepEqual(info.qualities, [2160, 720]);
  assert.equal(info.channel, 'Vimeo creator');
  assert.equal(info.thumbnail, null);
  assert.ok(!JSON.stringify(info).includes(VIMEO_HASH));
  assert.equal((await post('/info', { url: `${vimeoPlayer(VIMEO_UNLISTED)}?h=${VIMEO_HASH}` })).status, 200);
  for (const invalid of [vimeoPlayer(VIMEO_UNLISTED), `${vimeoPlayer(VIMEO_UNLISTED)}?h=987abc654d`]) {
    const denied = await post('/info', { url: invalid });
    assert.equal(denied.status, 502);
    const { error } = await denied.json();
    assert.match(error, /Vimeo could not open/);
    assert.ok(!error.includes(invalid));
  }
  assert.equal((await post('/info', { url: vimeoPlayer('1234') })).status, 400);
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(calls.filter(args => args.at(-1) === `${vimeoPlayer(VIMEO_UNLISTED)}?h=${VIMEO_HASH}`).length, 1);
});

test('Vimeo access refusals return an actionable error instead of a retry prompt', async t => {
  const { post } = await fixture(t);
  const denied = await post('/info', { url: vimeoPlayer(VIMEO_DENIED) });
  assert.equal(denied.status, 502);
  const { error } = await denied.json();
  assert.match(error, /Vimeo refused the download server’s request/);
  assert.match(error, /look for the Download button/);
});

test('Vimeo jobs check format availability and save a video or audio attachment', async t => {
  const { base, post, request, log } = await fixture(t);
  const source = `https://vimeo.com/${VIMEO_VIDEO}`;
  const info = await (await post('/info', { url: source })).json();
  assert.equal(info.thumbnail, 'https://i.vimeocdn.com/video/123.jpg');
  for (const format of ['best', 'mp3']) {
    const response = await post('/jobs', { url: source, format, quality: 'best' });
    assert.equal(response.status, 202);
    const { id } = await response.json();
    const state = await waitFor(request, id);
    const isVideo = format === 'best';
    assert.equal(state.status, 'ready');
    assert.equal(state.filename, isVideo ? 'Vimeo video.mkv' : 'Vimeo video.mp3');
    const file = await fetch(`${base}/files/${id}`);
    assert.equal(file.status, 200);
    assert.equal(file.headers.get('content-type'), isVideo ? 'video/x-matroska' : 'audio/mpeg');
    assert.equal(await file.text(), '0123456789video');
  }
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse);
  const downloads = calls.filter(args => !args.includes('--dump-single-json'));
  assert.equal(downloads.length, 2);
  for (const args of downloads) {
    assert.equal(args.at(-1), vimeoPlayer(VIMEO_VIDEO));
    assert.equal(args[args.indexOf('--use-extractors')+1], 'vimeo');
    assert.ok(args.includes('--check-formats'));
  }
  assert.equal(downloads[0][downloads[0].indexOf('-f')+1], 'bv*+ba/bv*');
  const blocked = await post('/jobs', { url: vimeoPlayer(VIMEO_DRM), format: 'best', quality: 'best' });
  const failed = await waitFor(request, (await blocked.json()).id);
  assert.equal(failed.status, 'error');
  assert.match(failed.error, /Vimeo only offered protected streams/);
});

test('quality discovery includes original VP9 and AV1 streams above 1080p without DRM, audio or storyboards', async t => {
  const { post } = await fixture(t);
  const high = await (await post('/info', { url: url('GGGGGGGGGGG') })).json();
  assert.deepEqual(high.qualities, [4320, 2160, 1080, 720]);
  assert.equal(high.bestQuality, 4320);
  const portrait = await (await post('/info', { url: url('HHHHHHHHHHH') })).json();
  assert.deepEqual(portrait.qualities, [2160, 1080, 720, 360]);
  const low = await (await post('/info', { url: url('IIIIIIIIIII') })).json();
  assert.deepEqual(low.qualities, [240]);
  assert.equal(low.bestQuality, 240);
  const audio = await (await post('/info', { url: url('JJJJJJJJJJJ') })).json();
  assert.deepEqual(audio.qualities, []);
  assert.equal(audio.bestQuality, null);
});

test('Best available keeps uncapped original video and audio and serves a lossless MKV attachment', async t => {
  const { base, post, request, log } = await fixture(t);
  const response = await post('/jobs', { url: url('GGGGGGGGGGG'), format: 'best', quality: 'best' });
  assert.equal(response.status, 202);
  const { id } = await response.json();
  const state = await waitFor(request, id);
  assert.equal(state.status, 'ready');
  assert.match(state.filename, /\.mkv$/);
  const file = await fetch(base + '/files/' + id);
  assert.equal(file.status, 200);
  assert.equal(file.headers.get('content-type'), 'video/x-matroska');
  assert.match(file.headers.get('content-disposition'), /\.mkv/);
  assert.equal(await file.text(), '0123456789video');
  const head = await fetch(base + '/files/' + id, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-length'), '15');
  const range = await fetch(base + '/files/' + id, { headers: { Range: 'bytes=2-5' } });
  assert.equal(range.status, 206);
  assert.equal(await range.text(), '2345');
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse);
  const download = calls.find(args => !args.includes('--dump-single-json'));
  assert.equal(download[download.indexOf('-f')+1], 'bv+ba/b');
  assert.equal(download[download.indexOf('--format-sort')+1], 'res,fps,hdr,lang,quality');
  assert.ok(download.includes('--format-sort-force'));
  assert.equal(download[download.indexOf('--merge-output-format')+1], 'mkv');
  assert.equal(download[download.indexOf('--remux-video')+1], 'mkv');
  assert.ok(!download.some(arg => /height<=|width<=|vcodec|ext=/.test(arg)));
  assert.ok(!download.includes('--recode-video'));
  assert.ok(!download.includes('--audio-format'));
});

test('explicit original-quality resolutions support portrait video and reject absent resolutions', async t => {
  const { post, request, log } = await fixture(t);
  const { id } = await (await post('/jobs', { url: url('HHHHHHHHHHH'), format: 'best', quality: 1080 })).json();
  const state = await waitFor(request, id);
  assert.equal(state.status, 'ready');
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse);
  const download = calls.find(args => !args.includes('--dump-single-json'));
  assert.equal(download[download.indexOf('-f')+1], 'bv[width<=1080]+ba/b[width<=1080]');
  assert.equal(download[download.indexOf('--format-sort')+1], 'res:1080,fps,hdr,lang,quality');
  assert.equal((await post('/jobs', { url: url('HHHHHHHHHHH'), format: 'best', quality: 4320 })).status, 400);
  assert.equal((await post('/jobs', { url: url('JJJJJJJJJJJ'), format: 'best', quality: 'best' })).status, 400);
});

test('legacy low-resolution MP4 clients and MP3 with Best available remain accepted', async t => {
  const { post, request } = await fixture(t);
  const legacy = await post('/jobs', { url: url('IIIIIIIIIII'), format: 'mp4', quality: 360 });
  assert.equal(legacy.status, 202);
  assert.equal((await waitFor(request, (await legacy.json()).id)).status, 'ready');
  const audio = await post('/jobs', { url: url(VIDEO), format: 'mp3', quality: 'best' });
  assert.equal(audio.status, 202);
  assert.match((await waitFor(request, (await audio.json()).id)).filename, /\.mp3$/);
});

test('MP4 job lifecycle produces a capability download with HEAD, Range and safe filenames', async t => {
  const { base, post, request, log } = await fixture(t);
  const response = await post('/jobs', { url: url(VIDEO), format: 'mp4', quality: 1080 });
  assert.equal(response.status, 202);
  const { id } = await response.json();
  assert.match(id, /^[a-f0-9]{64}$/);
  const state = await waitFor(request, id);
  assert.equal(state.status, 'ready'); assert.equal(state.progress, 100);
  assert.equal(state.downloadUrl, `https://appa.tailf12edd.ts.net/downloadvideo-backend/files/${id}`);
  const file = await fetch(base + '/files/' + id);
  assert.equal(file.status, 200); assert.equal(file.headers.get('content-type'), 'video/mp4');
  assert.match(file.headers.get('content-disposition'), /filename\*=UTF-8''Caf%C3%A9/);
  assert.equal(await file.text(), '0123456789video');
  const head = await fetch(base + '/files/' + id, { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(head.headers.get('content-length'), '15'); assert.equal(await head.text(), '');
  const partial = await fetch(base + '/files/' + id, { headers: { Range: 'bytes=2-5' } });
  assert.equal(partial.status, 206); assert.equal(partial.headers.get('content-range'), 'bytes 2-5/15'); assert.equal(await partial.text(), '2345');
  const bad = await fetch(base + '/files/' + id, { headers: { Range: 'bytes=99-100' } });
  assert.equal(bad.status, 416); assert.equal(bad.headers.get('content-range'), 'bytes */15');
  assert.equal((await fetch(base + '/files/' + '0'.repeat(64))).status, 404);
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse);
  const download = calls.find(args => !args.includes('--dump-single-json'));
  assert.ok(download.includes('--no-simulate')); assert.ok(download.includes('--ignore-config')); assert.ok(download.includes('--no-plugin-dirs'));
  assert.ok(download.includes('--remux-video')); assert.equal(download.at(-1), url(VIDEO));
});

test('long Unicode titles keep complete emoji in downloadable filenames', async t => {
  const { base, post, request } = await fixture(t);
  const { id } = await (await post('/jobs', { url: url('FFFFFFFFFFF'), format: 'mp4', quality: 720 })).json();
  const state = await waitFor(request, id);
  assert.equal(state.status, 'ready');
  assert.equal(state.filename, 'a'.repeat(99) + '😀.mp4');
  const response = await fetch(base + '/files/' + id);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /%F0%9F%98%80\.mp4/);
  await response.arrayBuffer();
});

test('MP3 selection reaches conversion and the capability expires with disk cleanup', async t => {
  const { base, app, post, request, dataDir, log } = await fixture(t, { ttlMs: 500 });
  const { id } = await (await post('/jobs', { url: url(VIDEO), format: 'mp3', quality: 720 })).json();
  const state = await waitFor(request, id);
  assert.equal(state.status, 'ready'); assert.match(state.filename, /\.mp3$/);
  const file = await fetch(base + '/files/' + id);
  assert.equal(file.headers.get('content-type'), 'audio/mpeg'); await file.arrayBuffer();
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.ok(calls.some(args => args.includes('--audio-format') && args.includes('mp3')));
  await delay(550);
  assert.equal((await fetch(base + '/files/' + id)).status, 404);
  await app.cleanup();
  assert.deepEqual(await readdir(dataDir), []);
});

test('creation rate is per trusted client and never inferred from arbitrary forwarded IP headers', async t => {
  const { post } = await fixture(t, { creationsPerHour: 1 });
  const body = { url: url(VIDEO), format: 'mp4', quality: 720 };
  assert.equal((await post('/jobs', body, { headers: { 'x-downloader-client': 'client-a' } })).status, 202);
  assert.equal((await post('/jobs', body, { headers: { 'x-downloader-client': 'client-a', 'x-forwarded-for': 'changed' } })).status, 429);
  assert.equal((await post('/jobs', body, { headers: { 'x-downloader-client': 'client-b' } })).status, 202);
});

test('active work and queue length stay bounded and a queued job can be cancelled', async t => {
  const { post, request, log } = await fixture(t, { maxActive: 1, maxQueued: 1 });
  const body = { url: url('CCCCCCCCCCC'), format: 'mp4', quality: 720 };
  const first = await (await post('/jobs', body)).json();
  const second = await (await post('/jobs', body)).json();
  assert.equal((await request('/jobs/' + second.id)).status, 200);
  assert.equal((await (await request('/jobs/' + second.id)).json()).status, 'queued');
  assert.equal((await post('/jobs', body)).status, 503);
  // Wait for the external mock process to start instead of assuming a 50 ms startup.
  const deadline = Date.now() + 1500;
  let downloadCalls = [];
  while (Date.now() < deadline) {
    downloadCalls = (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse).filter(args => !args.includes('--dump-single-json'));
    if (downloadCalls.length) break;
    await delay(15);
  }
  assert.equal(downloadCalls.length, 1);
  assert.equal((await request('/jobs/' + second.id, { method: 'DELETE' })).status, 200);
  assert.equal((await (await request('/jobs/' + second.id)).json()).status, 'error');
  await request('/jobs/' + first.id, { method: 'DELETE' });
});

test('metadata concurrency and maximum final output size are enforced', async t => {
  const unavailable = await fixture(t, { maxMetadata: 0 });
  assert.equal((await unavailable.post('/info', { url: url(VIDEO) })).status, 503);
  const { post, request, dataDir } = await fixture(t, { maxOutputBytes: 10 });
  const { id } = await (await post('/jobs', { url: url(VIDEO), format: 'mp4', quality: 720 })).json();
  const state = await waitFor(request, id);
  assert.equal(state.status, 'error'); assert.match(state.error, /download limit/);
  await waitForEmptyDirectory(dataDir);
});

test('process timeout and upstream bot blocks become safe errors and remove temporary files', async t => {
  const { post, request, dataDir } = await fixture(t, { jobTimeoutMs: 100 });
  const { id } = await (await post('/jobs', { url: url('DDDDDDDDDDD'), format: 'mp4', quality: 720 })).json();
  const timeout = await waitFor(request, id);
  assert.equal(timeout.status, 'error'); assert.match(timeout.error, /too long/);
  const upstream = await fixture(t);
  const failedId = (await (await upstream.post('/jobs', { url: url('EEEEEEEEEEE'), format: 'mp4', quality: 720 })).json()).id;
  const blocked = await waitFor(upstream.request, failedId);
  assert.equal(blocked.status, 'error'); assert.match(blocked.error, /YouTube blocked/);
  await waitForEmptyDirectory(dataDir);
});

test('DELETE cancels a running process, revokes its capability and cleans the directory', async t => {
  const { base, post, request, dataDir } = await fixture(t);
  const { id } = await (await post('/jobs', { url: url('CCCCCCCCCCC'), format: 'mp4', quality: 720 })).json();
  await waitFor(request, id, ['processing']);
  assert.equal((await request('/jobs/' + id, { method: 'DELETE' })).status, 200);
  assert.equal((await fetch(base + '/files/' + id)).status, 404);
  const state = await waitFor(request, id);
  assert.equal(state.status, 'error'); assert.match(state.error, /cancelled/);
  await waitForEmptyDirectory(dataDir);
});

test('low disk space blocks download before starting yt-dlp media work', async t => {
  const { post, request, log } = await fixture(t, { minFreeBytes: Infinity });
  const { id } = await (await post('/jobs', { url: url(VIDEO), format: 'mp4', quality: 720 })).json();
  const state = await waitFor(request, id);
  assert.equal(state.status, 'error'); assert.match(state.error, /temporary space/);
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(calls.length, 1); assert.ok(calls[0].includes('--dump-single-json'));
});

test('startup removes only marked app-owned job directories', async t => {
  const marked = 'a'.repeat(64), unmarked = 'b'.repeat(64);
  const { dataDir } = await fixture(t, {}, async directory => {
    await mkdir(path.join(directory, marked)); await writeFile(path.join(directory, marked, '.downloadvideo-job'), 'downloadvideo\n');
    await mkdir(path.join(directory, unmarked)); await writeFile(path.join(directory, unmarked, 'keep'), 'personal');
  });
  assert.deepEqual(await readdir(dataDir), [unmarked]);
  assert.equal(await readFile(path.join(dataDir, unmarked, 'keep'), 'utf8'), 'personal');
});
