import { Telegraf } from 'telegraf';
import sharp from 'sharp';
import renderLottie from 'puppeteer-lottie';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { mkdir, rm, stat } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = String(process.env.OWNER_ID || '').trim();
const ALLOWED_USER_IDS = new Set(
  String(process.env.ALLOWED_USER_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);
if (OWNER_ID) ALLOWED_USER_IDS.add(OWNER_ID);

// Safe default: whitelist mode. Set PUBLIC_ACCESS=true only if you want a public bot.
const PUBLIC_ACCESS = String(process.env.PUBLIC_ACCESS || 'false').toLowerCase() === 'true';
const TMP_DIR = process.env.TMP_DIR || '/tmp/sticker-alchemy';

if (!TOKEN) throw new Error('BOT_TOKEN is required');
if (!PUBLIC_ACCESS && ALLOWED_USER_IDS.size === 0) {
  throw new Error('Whitelist mode is enabled by default. Please set OWNER_ID or ALLOWED_USER_IDS, or explicitly set PUBLIC_ACCESS=true.');
}

const bot = new Telegraf(TOKEN, { handlerTimeout: 10 * 60 * 1000 });

const helpText = `Sticker Alchemy 🧪\n\n用法：\n\n图片转贴纸：\n- 回复图片 / 图片文件发送 /pts\n- 或直接发图片给我\n- /pts 😋 可指定 emoji\n\nGIF/视频转贴纸：\n- 回复 GIF、动图、短视频发送 /gif\n- 或直接发 GIF/视频给我\n\n贴纸转图片/GIF：\n- 直接发静态贴纸：转 PNG\n- 直接发 Telegram 动态贴纸：转 GIF\n- 或回复贴纸发送 /stp\n\n命令：/pts /pic_to_sticker /gif /stp /sticker_to_pic /help`;

function allowed(ctx) {
  return PUBLIC_ACCESS || ALLOWED_USER_IDS.has(String(ctx.from?.id || ''));
}

async function ensureAllowed(ctx) {
  if (allowed(ctx)) return true;
  await ctx.reply('这个 bot 是白名单模式，你没有使用权限。');
  return false;
}

function randomId() {
  return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

async function existsNonEmpty(file) {
  try {
    const s = await stat(file);
    return s.isFile() && s.size > 0;
  } catch {
    return false;
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || '/app',
      env: { ...process.env, ...(opts.env || {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), opts.timeoutMs || 120000);
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.on('error', err => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: String(err?.stack || err) });
    });
  });
}

function pickEmoji(text, fallback = '🙂') {
  const parts = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return parts.slice(1).join(' ').slice(0, 16);
  return fallback;
}

function repliedMessage(ctx) {
  return ctx.message?.reply_to_message || null;
}

function currentOrReply(ctx) {
  return repliedMessage(ctx) || ctx.message || null;
}

function bestPhoto(msg) {
  const arr = msg?.photo;
  return Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
}

function getInputKindAndFileId(msg, prefer) {
  if (!msg) return null;
  const photo = bestPhoto(msg);
  if (photo) return { kind: 'image', fileId: photo.file_id, name: 'photo.jpg' };
  if (msg.sticker?.file_id) {
    if (prefer === 'sticker') return {
      kind: 'sticker',
      fileId: msg.sticker.file_id,
      name: msg.sticker.file_unique_id || 'sticker',
      animated: Boolean(msg.sticker.is_animated),
      video: Boolean(msg.sticker.is_video),
    };
    if (!msg.sticker.is_animated && !msg.sticker.is_video) return { kind: 'image', fileId: msg.sticker.file_id, name: 'sticker.webp' };
    return { kind: 'video', fileId: msg.sticker.file_id, name: msg.sticker.is_animated ? 'sticker.tgs' : 'sticker.webm' };
  }
  if (msg.animation?.file_id) return { kind: 'video', fileId: msg.animation.file_id, name: msg.animation.file_name || 'animation.mp4' };
  if (msg.video?.file_id) return { kind: 'video', fileId: msg.video.file_id, name: msg.video.file_name || 'video.mp4' };
  if (msg.document?.file_id) {
    const mime = msg.document.mime_type || '';
    const name = msg.document.file_name || 'document';
    if (mime.startsWith('image/')) return { kind: 'image', fileId: msg.document.file_id, name };
    if (mime.startsWith('video/') || mime === 'image/gif' || /\.(gif|mp4|mov|webm|avi|mkv)$/i.test(name)) return { kind: 'video', fileId: msg.document.file_id, name };
  }
  return null;
}

async function downloadFile(ctx, fileId, dest) {
  const link = await ctx.telegram.getFileLink(fileId);
  const res = await fetch(link.href);
  if (!res.ok) throw new Error(`下载失败：HTTP ${res.status}`);
  await mkdir(path.dirname(dest), { recursive: true });
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(dest, buf);
  return dest;
}

async function convertImageToWebp(input, output, opts = {}) {
  const size = opts.size || 512;
  const quality = opts.quality || 90;
  const bg = opts.bg || { r: 0, g: 0, b: 0, alpha: 0 };
  let q = quality;
  for (let attempt = 0; attempt < 5; attempt++) {
    await sharp(input, { animated: true })
      .rotate()
      .resize(size, size, { fit: 'contain', background: bg, withoutEnlargement: true })
      .webp({ quality: q, effort: 6 })
      .toFile(output);
    const s = await stat(output);
    if (s.size <= 512 * 1024) return output;
    q = Math.max(50, q - 12);
  }
  throw new Error('图片转贴纸后仍超过 512KB。');
}

async function convertVideoToWebm(input, output) {
  const attempts = [
    { dur: '3', fps: '24', crf: '42', scale: '512' },
    { dur: '3', fps: '18', crf: '48', scale: '512' },
    { dur: '2.5', fps: '15', crf: '52', scale: '384' },
    { dur: '2', fps: '12', crf: '56', scale: '320' },
  ];
  let last = '';
  for (const a of attempts) {
    await rm(output, { force: true }).catch(() => {});
    const vf = `fps=${a.fps},scale=${a.scale}:${a.scale}:force_original_aspect_ratio=decrease,pad=${a.scale}:${a.scale}:(ow-iw)/2:(oh-ih)/2:color=black@0,format=yuva420p`;
    const args = [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-t', a.dur,
      '-i', input,
      '-an', '-vf', vf,
      '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', a.crf,
      '-pix_fmt', 'yuva420p', '-r', a.fps,
      output,
    ];
    const res = await run('ffmpeg', args, { timeoutMs: 120000 });
    last = (res.stderr || res.stdout || '').trim();
    if (res.code === 0 && await existsNonEmpty(output)) {
      const s = await stat(output);
      if (s.size <= 256 * 1024) return output;
      if (s.size <= 512 * 1024) return output;
      last = `输出过大：${s.size}`;
    }
  }
  throw new Error(`GIF/视频转贴纸失败：${last || 'unknown error'}`);
}


async function convertStickerToPng(input, output, meta = {}) {
  if (meta.animated) {
    throw new Error('动态贴纸请转 GIF，不截单帧。');
  }
  if (meta.video || /\.webm$/i.test(input)) {
    const res = await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-frames:v', '1', output], { timeoutMs: 60000 });
    if (res.code !== 0 || !(await existsNonEmpty(output))) throw new Error((res.stderr || res.stdout || '视频贴纸取帧失败').trim());
    return output;
  }
  await sharp(input, { animated: false }).png().toFile(output);
  return output;
}

async function gunzipTgsToJson(input, output) {
  const raw = await fs.promises.readFile(input);
  const json = raw[0] === 0x1f && raw[1] === 0x8b ? zlib.gunzipSync(raw) : raw;
  JSON.parse(json.toString('utf8'));
  await fs.promises.writeFile(output, json);
  return output;
}

async function pngFramesToGif(framePattern, out, frameCount, fps, width) {
  const firstFrame = framePattern.replace('%012d', String(1).padStart(12, '0'));
  const normalized = path.join(path.dirname(out), 'norm-%012d.png');
  for (let i = 1; i <= frameCount; i++) {
    const framePath = framePattern.replace('%012d', String(i).padStart(12, '0'));
    const normPath = normalized.replace('%012d', String(i).padStart(12, '0'));
    await sharp(framePath || firstFrame)
      .ensureAlpha()
      .resize(width, width, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(normPath);
  }
  const palette = path.join(path.dirname(out), 'palette.png');
  const vf = `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=reserve_transparent=1`;
  let res = await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', normalized, '-vf', vf, palette], { timeoutMs: 120000 });
  if (res.code !== 0 || !(await existsNonEmpty(palette))) throw new Error((res.stderr || res.stdout || '生成 GIF 调色板失败').trim());
  res = await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', normalized, '-i', palette, '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`, '-loop', '0', out], { timeoutMs: 120000 });
  if (res.code !== 0 || !(await existsNonEmpty(out))) throw new Error((res.stderr || res.stdout || '生成 GIF 失败').trim());
  return out;
}

async function convertTgsToGif(input, output, opts = {}) {
  const width = opts.width || 512;
  const fps = opts.fps || 15;
  const dir = path.dirname(output);
  const json = path.join(dir, 'sticker.json');
  const frames = path.join(dir, 'frame-%012d.png');
  await gunzipTgsToJson(input, json);
  const result = await renderLottie({
    path: json,
    output: frames,
    width,
    height: width,
    quiet: true,
    puppeteerOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] },
    renderer: 'svg',
  });
  const frameCount = Math.max(1, Number(result?.numFrames || 1));
  await pngFramesToGif(frames, output, frameCount, fps, width);
  return output;
}

async function convertStickerToGif(input, output, meta = {}) {
  if (meta.animated || /\.tgs$/i.test(input)) return convertTgsToGif(input, output, { fps: 15, width: 512 });
  if (meta.video || /\.webm$/i.test(input)) {
    const vf = 'fps=15,scale=512:-1:flags=lanczos,split[s0][s1];[s0]palettegen=reserve_transparent=1[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5';
    const res = await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-vf', vf, '-loop', '0', output], { timeoutMs: 120000 });
    if (res.code !== 0 || !(await existsNonEmpty(output))) throw new Error((res.stderr || res.stdout || '视频贴纸转 GIF 失败').trim());
    return output;
  }
  throw new Error('这个贴纸不是动态贴纸，不需要转 GIF。');
}

async function sendSticker(ctx, filePath, emoji) {
  await ctx.replyWithSticker({ source: fs.createReadStream(filePath), filename: path.basename(filePath) }, { emoji });
}

async function handleImage(ctx) {
  if (!(await ensureAllowed(ctx))) return;
  const msg = currentOrReply(ctx);
  const input = getInputKindAndFileId(msg, 'image');
  if (!input || input.kind !== 'image') {
    await ctx.reply('回复一张图片后发 /pts，或直接把图片发给我。');
    return;
  }
  const emoji = pickEmoji(ctx.message?.text, '🙂');
  const dir = path.join(TMP_DIR, randomId());
  const ext = path.extname(input.name || '') || '.jpg';
  const src = path.join(dir, `input${ext}`);
  const out = path.join(dir, 'sticker.webp');
  try {
    await downloadFile(ctx, input.fileId, src);
    await convertImageToWebp(src, out);
    await sendSticker(ctx, out, emoji);
  } catch (e) {
    await ctx.reply(`转换失败：${String(e?.message || e).slice(0, 500)}`);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function handleVideo(ctx) {
  if (!(await ensureAllowed(ctx))) return;
  const msg = currentOrReply(ctx);
  const input = getInputKindAndFileId(msg, 'video');
  if (!input || input.kind !== 'video') {
    await ctx.reply('回复 GIF/动图/短视频后发 /gif，或直接把 GIF/视频发给我。');
    return;
  }
  const emoji = pickEmoji(ctx.message?.text, '🙂');
  const dir = path.join(TMP_DIR, randomId());
  const ext = path.extname(input.name || '') || '.mp4';
  const src = path.join(dir, `input${ext}`);
  const out = path.join(dir, 'sticker.webm');
  try {
    await downloadFile(ctx, input.fileId, src);
    await convertVideoToWebm(src, out);
    await sendSticker(ctx, out, emoji);
  } catch (e) {
    await ctx.reply(`转换失败：${String(e?.message || e).slice(0, 500)}`);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}


async function handleStickerToPic(ctx) {
  if (!(await ensureAllowed(ctx))) return;
  const msg = currentOrReply(ctx);
  const input = getInputKindAndFileId(msg, 'sticker');
  if (!input || input.kind !== 'sticker') {
    await ctx.reply('回复一个贴纸后发 /stp，或直接把贴纸发给我。');
    return;
  }
  const dir = path.join(TMP_DIR, randomId());
  const ext = input.animated ? '.tgs' : input.video ? '.webm' : '.webp';
  const src = path.join(dir, `input${ext}`);
  const out = path.join(dir, input.animated || input.video ? 'sticker.gif' : 'sticker.png');
  try {
    await downloadFile(ctx, input.fileId, src);
    if (input.animated || input.video) {
      await convertStickerToGif(src, out, input);
      await ctx.replyWithAnimation({ source: fs.createReadStream(out), filename: 'sticker.gif' });
    } else {
      await convertStickerToPng(src, out, input);
      await ctx.replyWithPhoto({ source: fs.createReadStream(out), filename: 'sticker.png' });
    }
  } catch (e) {
    await ctx.reply(`转换失败：${String(e?.message || e).slice(0, 500)}`);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

bot.start(async (ctx) => {
  if (!(await ensureAllowed(ctx))) return;
  await ctx.reply(helpText);
});
bot.help(async (ctx) => {
  if (!(await ensureAllowed(ctx))) return;
  await ctx.reply(helpText);
});

bot.command(['pts', 'pic_to_sticker'], handleImage);
bot.command('gif', handleVideo);
bot.command(['stp', 'sticker_to_pic'], handleStickerToPic);

bot.on('photo', async (ctx) => {
  if (!(await ensureAllowed(ctx))) return;
  await handleImage(ctx);
});

bot.on('sticker', async (ctx) => {
  if (!(await ensureAllowed(ctx))) return;
  await handleStickerToPic(ctx);
});

bot.on(['animation', 'video'], async (ctx) => {
  if (!(await ensureAllowed(ctx))) return;
  await handleVideo(ctx);
});

bot.on('document', async (ctx) => {
  if (!(await ensureAllowed(ctx))) return;
  const input = getInputKindAndFileId(ctx.message);
  if (input?.kind === 'image') return handleImage(ctx);
  if (input?.kind === 'video') return handleVideo(ctx);
});

bot.catch((err, ctx) => {
  console.error('bot error', err);
  ctx?.reply?.(`出错了：${String(err?.message || err).slice(0, 500)}`).catch(() => {});
});

await mkdir(TMP_DIR, { recursive: true });
await bot.launch({ dropPendingUpdates: true });
console.log('Sticker Alchemy started');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
