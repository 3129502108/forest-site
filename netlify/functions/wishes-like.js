// ============================================================
// Netlify Function · 留言点赞接口
//   POST /api/wishes/like   { id, delta }  delta=1 点赞 / -1 取消
// 存储：Netlify Blobs（与 wishes.js 共用同一 store）
// ============================================================

const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'forest-wishes';
const KEY = 'wishes';

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
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method not allowed' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { ok: false, error: '请求格式不对' }); }
  if (!body || !body.id) return json(400, { ok: false, error: '缺少 id' });

  const store = getStore(STORE_NAME);
  const list = await readList(store);
  const wish = list.find(w => w.id === body.id);
  if (!wish) return json(404, { ok: false, error: '找不到这条留言' });

  wish.likes = (wish.likes || 0) + (body.delta === -1 ? -1 : 1);
  if (wish.likes < 0) wish.likes = 0;
  await store.set(KEY, JSON.stringify(list));

  return json(200, { ok: true, id: wish.id, likes: wish.likes });
};
