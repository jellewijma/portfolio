# Video downloader

`https://jellewijma.com/downloadvideo` serves a Next.js interface. Its API forwards small JSON requests to the Appa worker. Media processing and file delivery happen on Appa, so videos do not pass through a Vercel Function.

## Runtime

- Appa user service: `systemctl --user status downloadvideo.service`
- Worker: `127.0.0.1:8791`, public health endpoint `/downloadvideo-backend/health`
- Public path: `https://appa.tailf12edd.ts.net/downloadvideo-backend`
- Environment: `~/.config/downloadvideo/service.env`, permission `600`
- Binaries and temporary files: `~/.local/share/downloadvideo/`
- Logs: `journalctl --user -u downloadvideo.service`

The tracked systemd unit uses the current Appa paths. It runs as Jelle with a 1 GB memory ceiling, a CPU limit and filesystem restrictions. Appa has user lingering enabled, so the worker starts automatically through the persistent user service manager.

Vercel requests authenticate with the platform's `x-vercel-oidc-token`. The worker verifies the signature and the exact portfolio team, project and production or preview environment against Vercel's public keys. The shared key in the local environment is only needed for direct operations and local development. No shared secret needs to be configured on Vercel.

## Dependencies

Use Python 3.11 or later and Node 22 or later. The worker explicitly enables the existing Node runtime for YouTube JavaScript challenges.

```sh
python3 -m venv ~/.local/share/downloadvideo/venv
~/.local/share/downloadvideo/venv/bin/python -m pip install -r services/downloadvideo/requirements.txt
```

FFmpeg is supplied by `imageio-ffmpeg`; link its executable into `~/.local/share/downloadvideo/bin/ffmpeg`. Appa also has `ffprobe` extracted from the official [yt-dlp FFmpeg build](https://github.com/yt-dlp/FFmpeg-Builds/releases). Both executables are available through `FFMPEG_DIR`.

## Initial routing and service setup

Create a private environment file with a randomly generated `DOWNLOADVIDEO_API_KEY` of at least 24 characters. Optional settings are `PORT`, `HOST`, `DATA_DIR`, `YTDLP_BIN`, `FFMPEG_DIR` and `PUBLIC_BASE_URL`. Create the jobs directory before starting the unit.

```sh
cp services/downloadvideo/downloadvideo.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now downloadvideo.service
sudo tailscale funnel --bg --https 443 --set-path /downloadvideo-backend http://127.0.0.1:8791
```

The path handler preserves the existing Funnel root and other ports. Remove only this handler when rolling back:

```sh
sudo tailscale funnel --https 443 --set-path /downloadvideo-backend off
systemctl --user disable --now downloadvideo.service
```

## Limits and behavior

The worker accepts individual YouTube videos, including Shorts, and Vimeo video and player links. Vimeo requests use the official player and keep the privacy hash from a full unlisted link. The player must make the video available without an account or password. The worker rejects live streams, videos over two hours and unsupported URLs.

Video defaults to **Best available**, selecting the highest available stream resolution and preserving the video and audio codecs. FFmpeg combines the streams into MKV without re-encoding. There is no fixed resolution cap, so available 4K, 8K and higher-resolution streams can be selected. Quality options come from the video's actual streams and use the shorter dimension for portrait videos.

Selecting a numeric resolution sets an upper limit. The older MP4 API remains available for cached clients and compatible H.264/AAC output. MP3 converts audio to 192 kbps; the original-quality video mode preserves the source audio instead.

Two media jobs and four metadata lookups can run concurrently. The queue holds eight jobs, each client can request ten downloads per hour, jobs time out after fifteen minutes, final files are limited to 10 GB and temporary storage has a 40 GB quota. The worker keeps at least 2 GB of disk space free. Metadata is bounded and cached. Completed files expire after one hour; active transfers finish before cleanup. Restarting the worker invalidates its job links and clears marked temporary job directories.

File URLs contain 256-bit random capabilities. API operations require authentication. Files stream directly from disk with attachment, HEAD and byte-range support. Cancellation kills the worker process group and removes temporary files. Provider errors appear in the page.

## Verification

```sh
npm run test:downloadvideo
npm run check
```

Tests cover URL validation, authentication, Vercel tokens, uncapped quality selection, portrait resolution, limits, lifecycle, cancellation, cleanup and byte ranges with a mock downloader. Use a public video from each provider to verify real downloads after worker or dependency changes.
