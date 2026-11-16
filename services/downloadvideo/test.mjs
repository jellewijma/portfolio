import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createDownloader, parseYouTubeUrl, parseRange } from './server.mjs';

const KEY = 'a-local-test-key-with-at-least-24-characters';
const VIDEO = 'jNQXAC9IVRw';
const url = id => `https://www.youtube.com/watch?v=${id}`;

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
const id = new URL(args.at(-1)).searchParams.get('v');
if (args.includes('--dump-single-json')) {
  process.stdout.write(JSON.stringify({id, title: id === 'FFFFFFFFFFF' ? 'a'.repeat(99) + '😀' : 'Café / video', channel:'Test channel', duration: id === 'AAAAAAAAAAA' ? 7201 : 60,
    is_live:id === 'BBBBBBBBBBB', formats:[360,480,720,1080].map(height => ({ext:'mp4',vcodec:'avc1.640028',height})),
    thumbnail:'http://127.0.0.1/private', secret:'do not return', formats_extra:['irrelevant']}));
} else {
  if (id === 'EEEEEEEEEEE') { process.stderr.write('Sign in to confirm you are not a bot'); process.exit(1); }
  const ext = args.includes('-x') ? 'mp3' : 'mp4';
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

test('YouTube links canonicalize and reject arbitrary hosts, schemes, ports and playlists', () => {
  for (const input of [url(VIDEO), `https://youtu.be/${VIDEO}?si=anything`, `https://m.youtube.com/shorts/${VIDEO}`, `http://youtube.com/watch?v=${VIDEO}&list=ignored`]) {
    assert.deepEqual(parseYouTubeUrl(input), { id: VIDEO, url: url(VIDEO) });
  }
  for (const input of [undefined, 'file:///etc/passwd', 'https://youtube.com.attacker.test/watch?v=' + VIDEO,
    `https://youtube.com@127.0.0.1/watch?v=${VIDEO}`, `https://user@youtube.com/watch?v=${VIDEO}`,
    `https://youtube.com:443/watch?v=${VIDEO}`, `ftp://youtube.com/watch?v=${VIDEO}`,
    'https://youtube.com/playlist?list=PLanything', 'https://youtube.com/watch?v=../../etc/passwd',
    `https://youtu.be/${VIDEO}/extra`, 'https://127.0.0.1/watch?v=' + VIDEO]) {
    assert.throws(() => parseYouTubeUrl(input), { status: 400 }, String(input));
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
  assert.deepEqual(Object.keys(first).sort(), ['channel', 'duration', 'id', 'qualities', 'thumbnail', 'title']);
  assert.equal(first.thumbnail, `https://i.ytimg.com/vi/${VIDEO}/hqdefault.jpg`);
  assert.deepEqual(first.qualities, [1080, 720, 480, 360]);
  assert.equal((await post('/info', { url: `https://youtu.be/${VIDEO}` })).status, 200);
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].at(-1), url(VIDEO));
  assert.equal((await post('/info', { url: url('AAAAAAAAAAA') })).status, 400);
  assert.equal((await post('/info', { url: url('BBBBBBBBBBB') })).status, 400);
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
  const { base, app, post, request, dataDir, log } = await fixture(t, { ttlMs: 75 });
  const { id } = await (await post('/jobs', { url: url(VIDEO), format: 'mp3', quality: 720 })).json();
  const state = await waitFor(request, id);
  assert.equal(state.status, 'ready'); assert.match(state.filename, /\.mp3$/);
  const file = await fetch(base + '/files/' + id);
  assert.equal(file.headers.get('content-type'), 'audio/mpeg'); await file.arrayBuffer();
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.ok(calls.some(args => args.includes('--audio-format') && args.includes('mp3')));
  await delay(90);
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
  await delay(50);
  const calls = (await readFile(log, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(calls.filter(args => !args.includes('--dump-single-json')).length, 1);
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
  assert.deepEqual(await readdir(dataDir), []);
});

test('process timeout and upstream bot blocks become safe errors and remove temporary files', async t => {
  const { post, request, dataDir } = await fixture(t, { jobTimeoutMs: 100 });
  const { id } = await (await post('/jobs', { url: url('DDDDDDDDDDD'), format: 'mp4', quality: 720 })).json();
  const timeout = await waitFor(request, id);
  assert.equal(timeout.status, 'error'); assert.match(timeout.error, /too long/);
  const failedId = (await (await post('/jobs', { url: url('EEEEEEEEEEE'), format: 'mp4', quality: 720 })).json()).id;
  const blocked = await waitFor(request, failedId);
  assert.equal(blocked.status, 'error'); assert.match(blocked.error, /YouTube blocked/);
  assert.deepEqual(await readdir(dataDir), []);
});

test('DELETE cancels a running process, revokes its capability and cleans the directory', async t => {
  const { base, post, request, dataDir } = await fixture(t);
  const { id } = await (await post('/jobs', { url: url('CCCCCCCCCCC'), format: 'mp4', quality: 720 })).json();
  await waitFor(request, id, ['processing']);
  assert.equal((await request('/jobs/' + id, { method: 'DELETE' })).status, 200);
  assert.equal((await fetch(base + '/files/' + id)).status, 404);
  const state = await waitFor(request, id);
  assert.equal(state.status, 'error'); assert.match(state.error, /cancelled/);
  await delay(50); assert.deepEqual(await readdir(dataDir), []);
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
