// ============================================================
// 森林的奥妙 · 感想留言服务（零依赖，Node 内置模块）
// 数据永久保存在 data/wishes.json，无需登录，任何人可发
// 启动：node server.js   然后访问 http://localhost:3000
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const store = require('./store');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'wishes.json');
const PORT = process.env.PORT || 3000;

// ---------- 存储（由 store.js 统一提供：本地文件 / 云端 KV） ----------
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}
async function readWishes() {
  return store.read();
}
async function writeWishes(list) {
  return store.write(list);
}

// ---------- 工具 ----------
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
function clean(s, max) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);
}
function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}
function readBody(req, limitBytes = 20000) {
  return new Promise((resolve) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) { req.destroy(); resolve(null); return; }
      data += chunk;
    });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve(null); }
    });
    req.on('error', () => resolve(null));
  });
}

// 简易限流：同一 IP 每分钟最多 6 条
const rate = new Map();
function allowed(ip) {
  const now = Date.now();
  const rec = rate.get(ip) || { count: 0, ts: now };
  if (now - rec.ts > 60000) { rec.count = 0; rec.ts = now; }
  rec.count += 1;
  rate.set(ip, rec);
  return rec.count <= 6;
}

// ---------- 静态文件 ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function serveStatic(req, res, urlPath) {
  let u = decodeURIComponent(urlPath.split('?')[0]);
  if (u === '/') u = '/index.html';
  const filePath = path.normalize(path.join(ROOT, u));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 Not Found'); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      // 开发期禁用缓存，确保总是拿到最新文件
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(buf);
  });
}

// ---------- 路由 ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const p = url.pathname;
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

  // 列表：GET /api/wishes?season=spring
  if (p === '/api/wishes' && req.method === 'GET') {
    const season = url.searchParams.get('season');
    let list = await readWishes();
    if (season && SEASONS.includes(season)) list = list.filter(w => w.season === season);
    list.sort((a, b) => b.createdAt - a.createdAt);
    return sendJSON(res, 200, { ok: true, total: list.length, wishes: list.slice(0, 200) });
  }

  // 发布：POST /api/wishes  { name, text, season }
  if (p === '/api/wishes' && req.method === 'POST') {
    if (!allowed(ip)) return sendJSON(res, 429, { ok: false, error: '发送太快了，歇一会儿再来 🌿' });
    const body = await readBody(req);
    if (!body) return sendJSON(res, 400, { ok: false, error: '请求格式不对' });

    const text = clean(body.text, 500);
    const name = clean(body.name, 24) || '匿名旅人';
    const season = SEASONS.includes(body.season) ? body.season : 'spring';

    if (!text) return sendJSON(res, 400, { ok: false, error: '写点什么再发吧 🌱' });

    const wish = {
      id: crypto.randomUUID(),
      name,
      text,
      season,
      likes: 0,
      createdAt: Date.now(),
    };
    const list = await readWishes();
    list.push(wish);
    await writeWishes(list);
    return sendJSON(res, 201, { ok: true, wish });
  }

  // 点赞：POST /api/wishes/like  { id }
  if (p === '/api/wishes/like' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body || !body.id) return sendJSON(res, 400, { ok: false, error: '缺少 id' });
    const list = await readWishes();
    const wish = list.find(w => w.id === body.id);
    if (!wish) return sendJSON(res, 404, { ok: false, error: '找不到这条留言' });
    wish.likes = (wish.likes || 0) + (body.delta === -1 ? -1 : 1);
    if (wish.likes < 0) wish.likes = 0;
    await writeWishes(list);
    return sendJSON(res, 200, { ok: true, id: wish.id, likes: wish.likes });
  }

  // 删除：DELETE /api/wishes?id=xxx&key=管理密钥
  if (p === '/api/wishes' && req.method === 'DELETE') {
    const adminKey = process.env.ADMIN_KEY || '';
    if (!adminKey || url.searchParams.get('key') !== adminKey) {
      return sendJSON(res, 403, { ok: false, error: '没有权限' });
    }
    const id = url.searchParams.get('id');
    const list = await readWishes();
    const next = list.filter(w => w.id !== id);
    await writeWishes(next);
    return sendJSON(res, 200, { ok: true, removed: list.length - next.length });
  }

  if (p.startsWith('/api/')) return sendJSON(res, 404, { ok: false, error: 'not found' });

  return serveStatic(req, res, req.url);
});

ensureStore();
server.listen(PORT, () => {
  console.log('🌿 森林的奥妙 已启动');
  console.log('   浏览: http://localhost:' + PORT);
  console.log('   数据: ' + DATA_FILE);
});
