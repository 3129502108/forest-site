// ============================================================
// Netlify Function · 留言板主接口
//   GET    /api/wishes?season=spring   读取留言列表
//   POST   /api/wishes                 发布留言
//   DELETE /api/wishes?id=xxx&key=***  管理员删除
// 存储：Netlify Blobs（免费、持久、无需注册额外服务）
// ============================================================

const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const STORE_NAME = 'forest-wishes';
const KEY = 'wishes';

function clean(s, max) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max);
}

function json(code, obj) {
  return {
    statusCode: code,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(obj),
  };
}

async function readList(store) {
  const raw = await store.get(KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

exports.handler = async (event) => {
  const store = getStore(STORE_NAME);
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};

  // ---------- 列表 ----------
  if (method === 'GET') {
    const season = params.season;
    let list = await readList(store);
    if (season && SEASONS.includes(season)) list = list.filter(w => w.season === season);
    list.sort((a, b) => b.createdAt - a.createdAt);
    return json(200, { ok: true, total: list.length, wishes: list.slice(0, 200) });
  }

  // ---------- 发布 ----------
  if (method === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { ok: false, error: '请求格式不对' }); }

    const text = clean(body.text, 500);
    const name = clean(body.name, 24) || '匿名旅人';
    const season = SEASONS.includes(body.season) ? body.season : 'spring';
    if (!text) return json(400, { ok: false, error: '写点什么再发吧 🌱' });

    const wish = {
      id: crypto.randomUUID(),
      name,
      text,
      season,
      likes: 0,
      createdAt: Date.now(),
    };
    const list = await readList(store);
    list.push(wish);
    await store.set(KEY, JSON.stringify(list));
    return json(201, { ok: true, wish });
  }

  // ---------- 删除（需管理员 key） ----------
  if (method === 'DELETE') {
    const adminKey = process.env.ADMIN_KEY || '';
    if (!adminKey || params.key !== adminKey) {
      return json(403, { ok: false, error: '没有权限' });
    }
    const list = await readList(store);
    const next = list.filter(w => w.id !== params.id);
    await store.set(KEY, JSON.stringify(next));
    return json(200, { ok: true, removed: list.length - next.length });
  }

  return json(405, { ok: false, error: 'method not allowed' });
};
