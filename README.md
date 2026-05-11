# 🧪 Telegram Sticker Alchemy

[![Docker Image](https://img.shields.io/badge/ghcr.io-telegram--sticker--alchemy-blue?logo=docker)](https://github.com/shuijiao1/Telegram-Sticker-Alchemy/pkgs/container/telegram-sticker-alchemy)
[![Build](https://github.com/shuijiao1/Telegram-Sticker-Alchemy/actions/workflows/docker-ghcr.yml/badge.svg)](https://github.com/shuijiao1/Telegram-Sticker-Alchemy/actions/workflows/docker-ghcr.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**中文** | [English](README.en.md)

**Telegram 图片 / GIF / 视频 / 贴纸互转机器人**

> 图片变静态贴纸，GIF / 视频变视频贴纸，贴纸再转回 PNG / GIF。  
> 默认白名单模式，适合自己或小圈子自托管使用。

---

## 🎯 核心特性

- **图片 / 照片 → 静态贴纸**：输出 Telegram 兼容 `.webp`。
- **GIF / 视频 / 动图 → 视频贴纸**：输出 VP9 `.webm`。
- **静态贴纸 → PNG**：方便保存或二次处理。
- **动态贴纸 `.tgs` → GIF**：支持 Telegram Lottie 动态贴纸转换。
- **视频贴纸 `.webm` → GIF**：把 Telegram 视频贴纸转成常规 GIF。
- **直接发送 / 回复命令都可用**：可以自动识别媒体，也可以回复后手动触发。
- **白名单优先**：默认不公开；必须配置 `OWNER_ID` / `ALLOWED_USER_IDS`，或显式开启 `PUBLIC_ACCESS=true`。
- **Docker 部署友好**：镜像已发布到 GHCR，Docker Compose 不需要 `git clone`。

---

## 🚀 快速开始

先准备：

1. 到 [@BotFather](https://t.me/BotFather) 创建 Bot，拿到 `BOT_TOKEN`。
2. 用 [@userinfobot](https://t.me/userinfobot) 或 [@RawDataBot](https://t.me/RawDataBot) 获取你的 Telegram 数字用户 ID。

提供 3 种部署方式，

### 方式一：一键脚本

```bash
bash <(curl -Ls https://raw.githubusercontent.com/shuijiao1/Telegram-Sticker-Alchemy/main/deploy.sh)
```

脚本会：

1. 显示项目信息，检查 / 引导安装 Docker 与 Docker Compose。
2. 交互式收集：安装目录、Bot Token、Owner ID、是否公开访问。
3. 生成 `.env` + `docker-compose.yml`。
4. 执行 `docker compose pull && docker compose up -d`，并显示运行状态。

### 方式二：Docker Compose

```bash
mkdir -p sticker-alchemy/data sticker-alchemy/tmp
cd sticker-alchemy

curl -Lo docker-compose.yml https://raw.githubusercontent.com/shuijiao1/Telegram-Sticker-Alchemy/main/docker-compose.yml
curl -Lo .env.example https://raw.githubusercontent.com/shuijiao1/Telegram-Sticker-Alchemy/main/.env.example
cp .env.example .env
nano .env
```

`.env` 至少填写：

```env
BOT_TOKEN=123456:your_bot_token_here
OWNER_ID=123456789
PUBLIC_ACCESS=false
```

启动：

```bash
docker compose pull
docker compose up -d
docker compose logs -f
```

### 方式三：Docker（不用 Compose）

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

## 💬 使用方式

### 命令

- `/start` 或 `/help` — 查看帮助
- `/pts` 或 `/pic_to_sticker` — 把回复的图片 / 照片 / 静态贴纸转成贴纸
- `/pts 😋` — 转贴纸时指定 emoji
- `/gif` — 把回复的 GIF / 视频 / 动图转成视频贴纸
- `/stp` 或 `/sticker_to_pic` — 把回复的贴纸转成 PNG / GIF

也可以直接把图片、贴纸、GIF、短视频发给 Bot，它会自动选择合适的转换方式。

---

## ⚙️ 配置说明

`.env` 示例：

```env
BOT_TOKEN=123456:your_bot_token_here
OWNER_ID=123456789
ALLOWED_USER_IDS=
PUBLIC_ACCESS=false
TMP_DIR=/tmp/sticker-alchemy
```

| 变量 | 是否必填 | 默认值 | 说明 |
|---|---:|---|---|
| `BOT_TOKEN` | 是 | - | Telegram Bot Token |
| `OWNER_ID` | 是* | - | 主要允许用户的 Telegram 数字 ID |
| `ALLOWED_USER_IDS` | 否 | - | 额外允许用户 ID，多个用英文逗号分隔 |
| `PUBLIC_ACCESS` | 否 | `false` | 设为 `true` 后允许所有人使用 |
| `TMP_DIR` | 否 | `/tmp/sticker-alchemy` | 临时转换目录 |

> `OWNER_ID` / `ALLOWED_USER_IDS` 至少填一个；除非你明确设置 `PUBLIC_ACCESS=true`。

---

## ⚠️ 注意事项和限制

Telegram 对贴纸文件大小和格式限制比较严格。Bot 会自动压缩或降低参数，但太大、太长的视频仍然可能转换失败。

建议：

- GIF / 视频尽量短一点，适合做动态贴纸。
- 静态贴纸会导出为 512×512 WebP。
- 动图 / 视频贴纸会转换为较短的 VP9 WebM。
- Telegram 动态 `.tgs` 贴纸在“贴纸转图片/GIF”时会渲染成 GIF。

---

## 🛠 运维

所有持久化数据在安装目录下：

```text
sticker-alchemy/
├── docker-compose.yml
├── .env
├── data/        # 预留持久化目录
└── tmp/         # 临时转换文件
```

常用命令：

```bash
cd <安装目录>
docker compose ps                 # 状态
docker compose logs -f            # 实时日志
docker compose restart            # 重启
docker compose down               # 停止并删除容器，保留 data/tmp
```

升级：

```bash
cd <安装目录>
docker compose pull
docker compose up -d
```

也可以重跑一键脚本并选择升级 / 重装同目录配置。

---

## 🧩 源码运行（开发用）

```bash
git clone https://github.com/shuijiao1/Telegram-Sticker-Alchemy.git
cd Telegram-Sticker-Alchemy
npm install --omit=dev
cp .env.example .env
nano .env
npm start
```

语法检查：

```bash
npm run check
```

## License

MIT
