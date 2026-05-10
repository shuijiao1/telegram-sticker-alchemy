# Sticker Alchemy 🧪

**中文** | [English](README.en.md)

一个默认白名单模式的 Telegram 图片 / GIF / 视频 / 贴纸互转 Bot。

Sticker Alchemy 基于 Node.js、Telegraf、Sharp、FFmpeg 和 Lottie 渲染实现，适合自托管使用。你需要自己填写 Telegram Bot Token 和允许使用 Bot 的 Telegram 用户 ID。

## 功能

- 图片 / 照片 → Telegram 静态贴纸（`.webp`）
- GIF / 视频 / 动图 → Telegram 视频贴纸（`.webm`）
- 静态贴纸 → PNG 图片
- Telegram 动态贴纸（`.tgs`）→ GIF
- Telegram 视频贴纸（`.webm`）→ GIF
- 支持直接发送媒体给 Bot 自动转换
- 支持回复媒体后使用命令转换
- 默认白名单模式，默认不公开给所有人使用

## 命令

- `/start` 或 `/help` — 查看帮助
- `/pts` 或 `/pic_to_sticker` — 把回复的图片 / 照片 / 静态贴纸转成贴纸
- `/pts 😋` — 转贴纸时指定 emoji
- `/gif` — 把回复的 GIF / 视频 / 动图转成视频贴纸
- `/stp` 或 `/sticker_to_pic` — 把回复的贴纸转成 PNG / GIF

也可以直接把图片、贴纸、GIF、短视频发给 Bot，它会自动选择合适的转换方式。

## 安装

先准备两样东西：

- 从 [@BotFather](https://t.me/BotFather) 获取 `BOT_TOKEN`
- 获取你的 Telegram 数字用户 ID，推荐用 [@userinfobot](https://t.me/userinfobot) 或 [@RawDataBot](https://t.me/RawDataBot)

项目默认是白名单模式，至少需要填写 `OWNER_ID` 或 `ALLOWED_USER_IDS`，否则 Bot 会拒绝启动。

### 方式一：Docker Compose

适合大多数服务器，推荐这种。

```bash
git clone https://github.com/shuijiao1/telegram-sticker-alchemy.git
cd telegram-sticker-alchemy
cp .env.example .env
nano .env
```

编辑 `.env`，至少填写：

```env
BOT_TOKEN=123456:your_bot_token_here
OWNER_ID=123456789
PUBLIC_ACCESS=false
```

启动：

```bash
docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f
```

停止：

```bash
docker compose down
```

以后更新：

```bash
git pull
docker compose up -d --build
```

### 方式二：纯 Docker

不想用 Docker Compose 的话，可以直接构建镜像运行。

```bash
git clone https://github.com/shuijiao1/telegram-sticker-alchemy.git
cd telegram-sticker-alchemy
cp .env.example .env
nano .env
```

构建镜像：

```bash
docker build -t sticker-alchemy .
```

运行：

```bash
docker run -d \
  --name sticker-alchemy \
  --restart unless-stopped \
  --env-file .env \
  -v "$PWD/data:/app/data" \
  -v "$PWD/tmp:/tmp/sticker-alchemy" \
  sticker-alchemy
```

查看日志：

```bash
docker logs -f sticker-alchemy
```

停止并删除容器：

```bash
docker rm -f sticker-alchemy
```

更新：

```bash
git pull
docker build -t sticker-alchemy .
docker rm -f sticker-alchemy
# 然后重新执行上面的 docker run 命令
```

### 方式三：手动安装

适合不想用 Docker、愿意自己处理系统依赖的环境。

需要：

- Node.js 22+
- 带 `libvpx-vp9` 支持的 FFmpeg
- `sharp` 和 Chromium / Puppeteer 所需的系统依赖

Debian / Ubuntu 可以先安装依赖：

```bash
sudo apt update
sudo apt install -y nodejs npm ffmpeg ca-certificates file \
  libnss3 libnspr4 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libxtst6 \
  libpangocairo-1.0-0 libpango-1.0-0 libcairo2 libgtk-3-0 fonts-noto-color-emoji
```

安装并运行：

```bash
git clone https://github.com/shuijiao1/telegram-sticker-alchemy.git
cd telegram-sticker-alchemy
npm install --omit=dev
cp .env.example .env
nano .env
npm start
```

如果想长期后台运行，建议配合 `systemd`、`pm2` 或其他进程管理工具。

## 配置说明

`.env` 示例：

```env
BOT_TOKEN=123456:your_bot_token_here
OWNER_ID=123456789
# ALLOWED_USER_IDS=123456789,987654321
PUBLIC_ACCESS=false
TMP_DIR=/tmp/sticker-alchemy
```

| 变量 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `BOT_TOKEN` | 是 | - | 从 BotFather 获取的 Telegram Bot API Token |
| `OWNER_ID` | 是，除非设置了 `ALLOWED_USER_IDS` 或公开模式 | - | 允许使用 Bot 的 Telegram 数字用户 ID |
| `ALLOWED_USER_IDS` | 否 | - | 多个允许用户 ID，英文逗号分隔 |
| `PUBLIC_ACCESS` | 否 | `false` | 设为 `true` 后允许所有人使用 |
| `TMP_DIR` | 否 | `/tmp/sticker-alchemy` | 临时转换目录 |

不要提交 `.env` 文件。项目已经默认通过 `.gitignore` 忽略 `.env`。

## 注意事项和限制

Telegram 对贴纸文件大小和格式限制比较严格。Bot 会自动压缩或降低参数，但太大、太长的视频仍然可能转换失败。

建议：

- GIF / 视频尽量短一点，适合做动态贴纸。
- 静态贴纸会导出为 512×512 WebP。
- 动图 / 视频贴纸会转换为较短的 VP9 WebM。
- Telegram 动态 `.tgs` 贴纸在“贴纸转图片/GIF”时会渲染成 GIF。

## 开发

语法检查：

```bash
npm run check
```

本地运行：

```bash
BOT_TOKEN=xxx OWNER_ID=123456789 npm start
```

## License

MIT
