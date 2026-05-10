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

## Security model

Sticker Alchemy is **whitelist-only by default**.

You must set one of:

- `OWNER_ID=your_telegram_numeric_user_id`
- `ALLOWED_USER_IDS=123456789,987654321`

If you really want a public bot, explicitly set:

```env
PUBLIC_ACCESS=true
```

Do not commit your `.env` file. `.env` is ignored by Git.

## Requirements

### Docker installation

Recommended for most users:

- Docker
- Docker Compose plugin
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Your numeric Telegram user ID from [@userinfobot](https://t.me/userinfobot) or [@RawDataBot](https://t.me/RawDataBot)

### Manual installation

- Node.js 22+
- FFmpeg with `libvpx-vp9`
- Native dependencies required by `sharp` and Chromium/Puppeteer

Docker is easier because the image installs the needed system packages.

## Quick start with Docker Compose

```bash
git clone https://github.com/shuijiao1/telegram-sticker-alchemy.git
cd telegram-sticker-alchemy
cp .env.example .env
nano .env
```

Fill in at least:

```env
BOT_TOKEN=123456:your_bot_token_here
OWNER_ID=123456789
PUBLIC_ACCESS=false
```

Start the bot:

```bash
docker compose up -d --build
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
docker compose up -d --build
```

## Manual installation

Install system packages on Debian/Ubuntu:

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

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `BOT_TOKEN` | Yes | - | Telegram Bot API token from BotFather |
| `OWNER_ID` | Yes, unless `ALLOWED_USER_IDS` or public mode is set | - | Numeric Telegram user ID allowed to use the bot |
| `ALLOWED_USER_IDS` | No | - | Comma-separated list of allowed numeric Telegram user IDs |
| `PUBLIC_ACCESS` | No | `false` | Set to `true` to allow anyone to use the bot |
| `TMP_DIR` | No | `/tmp/sticker-alchemy` | Temporary conversion directory |

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
