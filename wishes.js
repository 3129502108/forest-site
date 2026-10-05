// ============================================================
// 写给森林的话 · 前端逻辑
// ============================================================

const SEASON_META = {
  spring: { label: '春', color: '#2e4a34', img: 'images/season-spring.jpg' },
  summer: { label: '夏', color: '#1f4429', img: 'images/season-summer.jpg' },
  autumn: { label: '秋', color: '#4a3820', img: 'images/season-autumn.jpg' },
  winter: { label: '冬', color: '#2a3a44', img: 'images/season-winter.jpg' },
};

// 留言页背景用的“动物图”（四季卡片上传的那四张）
const ANIMAL_BG = {
  spring: 'images/animal-spring.jpg',
  summer: 'images/animal-summer.jpg',
  autumn: 'images/animal-autumn.jpg',
  winter: 'images/animal-winter.jpg',
};

const el = {
  name: document.getElementById('nameInput'),
  season: document.getElementById('seasonSelect'),
  text: document.getElementById('textInput'),
  count: document.getElementById('charCount'),
  submit: document.getElementById('submitBtn'),
  msg: document.getElementById('composeMsg'),
  list: document.getElementById('wishList'),
  filter: document.getElementById('filterBar'),
  seasonLabel: document.getElementById('seasonLabel'),
  heroBg: document.querySelector('.wishes-hero__bg'),
};

let currentSeason = 'all';

// 本地点赞记录（浏览器本地，防止重复点同一台的赞）
const likedSet = new Set(JSON.parse(localStorage.getItem('forest-liked') || '[]'));
function saveLiked() { localStorage.setItem('forest-liked', JSON.stringify([...likedSet])); }

async function toggleLike(id, btn) {
  const liked = likedSet.has(id);
  const delta = liked ? -1 : 1;
  try {
    const res = await fetch('/api/wishes/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delta }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error();
    if (liked) likedSet.delete(id); else likedSet.add(id);
    saveLiked();
    btn.textContent = '❤️ ' + data.likes;
    btn.classList.toggle('is-liked', !liked);
    btn.classList.remove('is-pop');
    void btn.offsetWidth;
    if (!liked) btn.classList.add('is-pop');
  } catch {
    // 失败就静默，不改本地点赞状态
  }
}

// ---------- URL 参数：从四季卡片带过来的季节 ----------
(function initFromUrl() {
  const q = new URLSearchParams(location.search).get('season');
  if (q && SEASON_META[q]) {
    el.season.value = q;
    currentSeason = q;
    el.seasonLabel.textContent = SEASON_META[q].label + '天的森林，在听你说话';
    el.heroBg.style.backgroundImage = "url('" + (ANIMAL_BG[q] || SEASON_META[q].img) + "')";
    // 同步筛选按钮
    document.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('chip--active', c.dataset.season === q);
    });
  }
})();

// ---------- 字数统计 ----------
el.text.addEventListener('input', () => {
  el.count.textContent = el.text.value.length;
});

// ---------- 提示 ----------
function showMsg(text, kind) {
  el.msg.textContent = text;
  el.msg.className = 'compose__msg ' + (kind || '');
}

// ---------- 提交 ----------
el.submit.addEventListener('click', async () => {
  const text = el.text.value.trim();
  if (!text) { showMsg('写点什么再发吧 🌱', 'err'); el.text.focus(); return; }

  el.submit.disabled = true;
  showMsg('正在投递给林间的风……', '');
  try {
    const res = await fetch('/api/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: el.name.value.trim(),
        text,
        season: el.season.value || 'spring',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || '发送失败');
    showMsg('🌿 已经留在林间了，谢谢你的话。', 'ok');
    el.text.value = '';
    el.count.textContent = '0';
    // 如果当前筛选与发布的季节不冲突，直接刷新列表
    if (currentSeason === 'all' || currentSeason === data.wish.season) {
      prependWish(data.wish);
    }
  } catch (e) {
    showMsg(e.message || '发送失败，等会儿再试试', 'err');
  } finally {
    el.submit.disabled = false;
  }
});

// ---------- 渲染 ----------
function timeText(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function wishNode(w) {
  const meta = SEASON_META[w.season] || SEASON_META.spring;
  const art = document.createElement('article');
  art.className = 'wish';
  art.dataset.season = w.season;

  const top = document.createElement('div');
  top.className = 'wish__top';

  const name = document.createElement('span');
  name.className = 'wish__name';
  name.textContent = w.name || '匿名旅人';

  const season = document.createElement('span');
  season.className = 'wish__season';
  season.dataset.season = w.season;
  season.textContent = meta.label;

  const time = document.createElement('span');
  time.className = 'wish__time';
  time.textContent = timeText(w.createdAt);

  const like = document.createElement('button');
  like.type = 'button';
  like.className = 'wish__like';
  if (likedSet.has(w.id)) like.classList.add('is-liked');
  like.textContent = '❤️ ' + (w.likes || 0);
  like.addEventListener('click', () => toggleLike(w.id, like));

  top.append(name, season, time, like);

  const p = document.createElement('p');
  p.className = 'wish__text';
  p.textContent = w.text;

  art.append(top, p);
  return art;
}

function prependWish(w) {
  const empty = el.list.querySelector('.wish-empty');
  if (empty) empty.remove();
  el.list.prepend(wishNode(w));
}

function renderEmpty(msg) {
  el.list.innerHTML = '<p class="wish-empty">' + msg + '</p>';
}

// ---------- 加载列表 ----------
async function loadWishes() {
  try {
    const q = currentSeason === 'all' ? '' : '?season=' + currentSeason;
    const res = await fetch('/api/wishes' + q);
    const data = await res.json();
    if (!data.ok) throw new Error();
    if (!data.wishes.length) {
      renderEmpty(currentSeason === 'all' ? '还没有人留下话，来做第一个吧 🌱' : '这一季还很安静，写下你的第一句吧。');
      return;
    }
    el.list.innerHTML = '';
    data.wishes.forEach(w => el.list.append(wishNode(w)));
  } catch {
    renderEmpty('暂时读不到林间的回声，稍后再试。');
  }
}

// ---------- 筛选 ----------
el.filter.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
  btn.classList.add('chip--active');
  currentSeason = btn.dataset.season;
  loadWishes();
});

loadWishes();
