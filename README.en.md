# 🧪 Telegram Sticker Alchemy

[![Docker Image](https://img.shields.io/badge/ghcr.io-telegram--sticker--alchemy-blue?logo=docker)](https://github.com/shuijiao1/Telegram-Sticker-Alchemy/pkgs/container/telegram-sticker-alchemy)
[![Build](https://github.com/shuijiao1/Telegram-Sticker-Alchemy/actions/workflows/docker-ghcr.yml/badge.svg)](https://github.com/shuijiao1/Telegram-Sticker-Alchemy/actions/workflows/docker-ghcr.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[中文](README.md) | **English**

**A self-hosted Telegram bot for converting images, GIFs, videos, and stickers.**

> Images to static stickers, GIFs/videos to video stickers, stickers back to PNG/GIF. Whitelist mode is enabled by default.

---

## Features

- Images/photos → Telegram static sticker (`.webp`).
- GIF/video/animation → Telegram video sticker (`.webm`, VP9).
- Static sticker → PNG.
- Telegram animated sticker (`.tgs`) → GIF.
- Telegram video sticker (`.webm`) → GIF.
- Automatic media detection or reply-based commands.
- Whitelist-first access control via `OWNER_ID` / `ALLOWED_USER_IDS`.
- Docker-first deployment with GHCR images; Docker Compose does not require `git clone`.

---

## Quick Start

Prepare two values first:

1. Create a bot with [@BotFather](https://t.me/BotFather) and get `BOT_TOKEN`.
2. Get your numeric Telegram user ID from [@userinfobot](https://t.me/userinfobot) or [@RawDataBot](https://t.me/RawDataBot).

### Option 1: One-click installer (recommended)

```bash
bash <(curl -Ls https://raw.githubusercontent.com/shuijiao1/Telegram-Sticker-Alchemy/main/deploy.sh)
```

The script checks Docker, asks for the install directory / token / owner ID, writes `.env` and `docker-compose.yml`, then runs `docker compose pull && docker compose up -d`.

### Option 2: Docker Compose (manual, no git clone)

```bash
mkdir -p sticker-alchemy/data sticker-alchemy/tmp
cd sticker-alchemy

curl -Lo docker-compose.yml https://raw.githubusercontent.com/shuijiao1/Telegram-Sticker-Alchemy/main/docker-compose.yml
curl -Lo .env.example https://raw.githubusercontent.com/shuijiao1/Telegram-Sticker-Alchemy/main/.env.example
cp .env.example .env
nano .env
```

Required values:

```env
BOT_TOKEN=123456:your_bot_token_here
OWNER_ID=123456789
PUBLIC_ACCESS=false
```

Run:

```bash
docker compose pull
docker compose up -d
docker compose logs -f
```

### Option 3: Docker run

```bash
mkdir -p sticker-alchemy/data sticker-alchemy/tmp
cd sticker-alchemy
curl -Lo .env https://raw.githubusercontent.com/shuijiao1/Telegram-Sticker-Alchemy/main/.env.example
nano .env

docker run -d \
  --name sticker-alchemy \
  --restart unless-stopped \
  --env-file .env \
  -v "$PWD/data:/app/data" \
  -v "$PWD/tmp:/tmp/sticker-alchemy" \
  ghcr.io/shuijiao1/telegram-sticker-alchemy:latest
```

---

## Usage

Commands:

- `/start` or `/help` — help
- `/pts` or `/pic_to_sticker` — convert replied image/photo/static sticker to sticker
- `/pts 😋` — set sticker emoji
- `/gif` — convert replied GIF/video/animation to video sticker
- `/stp` or `/sticker_to_pic` — convert replied sticker to PNG/GIF

You can also send supported media directly and the bot will choose the conversion automatically.

---

## Configuration

```env
BOT_TOKEN=123456:your_bot_token_here
OWNER_ID=123456789
ALLOWED_USER_IDS=
PUBLIC_ACCESS=false
TMP_DIR=/tmp/sticker-alchemy
```

`OWNER_ID` or `ALLOWED_USER_IDS` is required unless `PUBLIC_ACCESS=true` is explicitly set.

---

## Operations

```bash
cd <install-dir>
docker compose ps
docker compose logs -f
docker compose restart
docker compose down
```

Upgrade:

```bash
cd <install-dir>
docker compose pull
docker compose up -d
```

---

## Development

```bash
git clone https://github.com/shuijiao1/Telegram-Sticker-Alchemy.git
cd Telegram-Sticker-Alchemy
npm install --omit=dev
cp .env.example .env
nano .env
npm start
```

Check syntax:

```bash
npm run check
```

## License

MIT
