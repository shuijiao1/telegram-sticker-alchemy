# Sticker Alchemy 🧪

[中文](README.md) | **English**

A whitelist-first Telegram bot that turns pictures, GIFs, videos, and stickers into each other.

Sticker Alchemy is built with Node.js, Telegraf, Sharp, FFmpeg, and Lottie rendering. It is designed for self-hosting: you bring your own Telegram Bot Token and your own Telegram user ID.

## Features

- Image/photo → Telegram static sticker (`.webp`)
- GIF/video/animation → Telegram video sticker (`.webm`)
- Static sticker → PNG image
- Telegram animated sticker (`.tgs`) → GIF
- Telegram video sticker (`.webm`) → GIF
- Direct-send mode: send supported media directly to the bot
- Reply mode: reply to media with a command
- Whitelist-first security: the bot is private by default

## Commands

- `/start` or `/help` — show help
- `/pts` or `/pic_to_sticker` — convert a replied image/photo/static sticker to sticker
- `/pts 😋` — convert image to sticker with custom emoji metadata
- `/gif` — convert a replied GIF/video/animation to video sticker
- `/stp` or `/sticker_to_pic` — convert a replied sticker to PNG/GIF

You can also send photos, stickers, GIFs, or short videos directly to the bot. It will pick the matching conversion automatically.

## Installation

Prepare two things first:

- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Your numeric Telegram user ID from [@userinfobot](https://t.me/userinfobot) or [@RawDataBot](https://t.me/RawDataBot)

The bot uses whitelist mode by default. You must set `OWNER_ID` or `ALLOWED_USER_IDS`, otherwise the bot will refuse to start.

### Option 1: Docker Compose

Recommended for most servers. The repository `docker-compose.yml` uses the prebuilt GHCR image by default, so local image building is not required.

```bash
git clone https://github.com/shuijiao1/telegram-sticker-alchemy.git
cd telegram-sticker-alchemy
cp .env.example .env
nano .env
```

Edit `.env` and fill in at least:

```env
BOT_TOKEN=123456:your_bot_token_here
OWNER_ID=123456789
PUBLIC_ACCESS=false
```

Start:

```bash
docker compose up -d
```

View logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

Update later:

```bash
git pull
docker compose pull
docker compose up -d
```

If you prefer building from source locally, change `image:` in `docker-compose.yml` to `build: .`, or use the plain Docker local build instructions below.

### Option 2: Docker

If you do not want to use Docker Compose, pull and run the GHCR image directly.

```bash
mkdir -p sticker-alchemy/data sticker-alchemy/tmp
cd sticker-alchemy
curl -fsSL https://raw.githubusercontent.com/shuijiao1/telegram-sticker-alchemy/main/.env.example -o .env
nano .env
```

Pull:

```bash
docker pull ghcr.io/shuijiao1/telegram-sticker-alchemy:latest
```

Run:

```bash
docker run -d \
  --name sticker-alchemy \
  --restart unless-stopped \
  --env-file .env \
  -v "$PWD/data:/app/data" \
  -v "$PWD/tmp:/tmp/sticker-alchemy" \
  ghcr.io/shuijiao1/telegram-sticker-alchemy:latest
```

View logs:

```bash
docker logs -f sticker-alchemy
```

Stop and remove the container:

```bash
docker rm -f sticker-alchemy
```

Update:

```bash
docker pull ghcr.io/shuijiao1/telegram-sticker-alchemy:latest
docker rm -f sticker-alchemy
# Then run the docker run command above again.
```

If you prefer building the image locally:

```bash
git clone https://github.com/shuijiao1/telegram-sticker-alchemy.git
cd telegram-sticker-alchemy
docker build -t sticker-alchemy .
```

### Option 3: Manual install

Use this if you do not want Docker and are comfortable managing system dependencies yourself.

Requirements:

- Node.js 22+
- FFmpeg with `libvpx-vp9`
- Native dependencies required by `sharp` and Chromium/Puppeteer

Install dependencies on Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y nodejs npm ffmpeg ca-certificates file \
  libnss3 libnspr4 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libxtst6 \
  libpangocairo-1.0-0 libpango-1.0-0 libcairo2 libgtk-3-0 fonts-noto-color-emoji
```

Install and run:

```bash
git clone https://github.com/shuijiao1/telegram-sticker-alchemy.git
cd telegram-sticker-alchemy
npm install --omit=dev
cp .env.example .env
nano .env
npm start
```

For long-term background running, use `systemd`, `pm2`, or another process manager.

## Configuration

Example `.env`:

```env
BOT_TOKEN=123456:your_bot_token_here
OWNER_ID=123456789
# ALLOWED_USER_IDS=123456789,987654321
PUBLIC_ACCESS=false
TMP_DIR=/tmp/sticker-alchemy
```

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `BOT_TOKEN` | Yes | - | Telegram Bot API token from BotFather |
| `OWNER_ID` | Yes, unless `ALLOWED_USER_IDS` or public mode is set | - | Numeric Telegram user ID allowed to use the bot |
| `ALLOWED_USER_IDS` | No | - | Comma-separated list of allowed numeric Telegram user IDs |
| `PUBLIC_ACCESS` | No | `false` | Set to `true` to allow anyone to use the bot |
| `TMP_DIR` | No | `/tmp/sticker-alchemy` | Temporary conversion directory |

Do not commit your `.env` file. `.env` is ignored by Git.

## Notes and limits

Telegram sticker limits are strict. The bot automatically compresses or downscales outputs, but very large or long videos may still fail.

Practical tips:

- Use short GIFs/videos for animated stickers.
- Static stickers are exported as 512×512 WebP.
- Animated/video stickers are converted to short VP9 WebM files.
- Telegram animated `.tgs` stickers are rendered to GIF when converting sticker → image/GIF.

## Development

Syntax check:

```bash
npm run check
```

Run locally:

```bash
BOT_TOKEN=xxx OWNER_ID=123456789 npm start
```

## License

MIT
