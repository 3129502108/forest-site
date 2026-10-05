// ============================================================
// 留言存储层（双模式）
//   - 本地开发：读写 data/wishes.json（默认）
//   - 云端（Cloudflare Pages + KV）：若绑定 KV，自动改用 KV 存储
// 通过环境变量 / 绑定探测自动选择，业务代码无需感知。
// ============================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'wishes.json');

// ---------- 本地文件模式 ----------
function fileRead() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const arr = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function fileWrite(list) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

// ---------- 云端 KV 模式（由平台注入的 KV 对象） ----------
// 约定：把 KV 绑定对象通过 globalThis.__FOREST_KV__ 注入（见 api 适配层）
function kv() {
  return globalThis.__FOREST_KV__ || null;
}

async function kvRead() {
  const raw = await kv().get('wishes');
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function kvWrite(list) {
  await kv().put('wishes', JSON.stringify(list));
}

// ---------- 对外统一接口（始终返回 Promise） ----------
async function read() {
  if (kv()) return kvRead();
  return fileRead();
}

async function write(list) {
  if (kv()) return kvWrite(list);
  return fileWrite(list);
}

module.exports = { read, write };
