// ============================================================
// 全站通用增强：主题切换 / 移动端菜单 / 页面切换过渡 / 滚动视差
// 在所有页面引入
// ============================================================

(function () {
  const root = document.documentElement;

  // ---------- 主题（记忆在 localStorage） ----------
  const savedTheme = localStorage.getItem('forest-theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  function applyThemeIcon(btn) {
    if (!btn) return;
    const isLight = root.getAttribute('data-theme') === 'light';
    btn.textContent = isLight ? '🌙' : '☀️';
    btn.title = isLight ? '切换到深色' : '切换到浅色';
  }

  window.__toggleForestTheme = function (btn) {
    const isLight = root.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    if (next === 'dark') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', 'light');
    localStorage.setItem('forest-theme', next);
    applyThemeIcon(btn);
  };

  // ---------- 注入顶部工具条（主题 + 汉堡） ----------
  function buildTools() {
    if (document.querySelector('.top-tools')) return;
    const tools = document.createElement('div');
    tools.className = 'top-tools';

    const themeBtn = document.createElement('button');
    themeBtn.className = 'tool-btn';
    themeBtn.type = 'button';
    themeBtn.addEventListener('click', () => window.__toggleForestTheme(themeBtn));
    applyThemeIcon(themeBtn);

    const hamburger = document.createElement('button');
    hamburger.className = 'tool-btn hamburger';
    hamburger.type = 'button';
    hamburger.textContent = '☰';
    hamburger.title = '菜单';

    const menu = document.createElement('div');
    menu.className = 'mobile-menu';
    menu.innerHTML =
      '<button class="mobile-menu__close" type="button">✕</button>' +
      '<a href="index.html">首页</a>' +
      '<a href="about.html">关于森林</a>' +
      '<a href="gallery.html">美景画廊</a>' +
      '<a href="seasons.html">四季</a>' +
      '<a href="sounds.html">森林之声</a>' +
      '<a href="trees.html">树种认识</a>' +
      '<a href="visit.html">探访</a>';

    hamburger.addEventListener('click', () => menu.classList.add('is-open'));
    menu.querySelector('.mobile-menu__close').addEventListener('click', () => menu.classList.remove('is-open'));
    menu.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => menu.classList.remove('is-open'))
    );

    tools.append(themeBtn, hamburger);
    document.body.append(tools, menu);
  }

  // ---------- 内页“返回上一级”按钮 ----------
  // 仅在内页显示（首页无上一级）。优先 history.back()，无历史时回首页。
  function buildBackButton() {
    const isHome = !document.body.classList.contains('page-body') &&
      !document.body.classList.contains('wishes-body');
    if (isHome) return;
    if (document.querySelector('.back-fab')) return;
    const btn = document.createElement('button');
    btn.className = 'back-fab';
    btn.type = 'button';
    btn.textContent = '← 返回上一级';
    btn.title = '返回上一级';
    btn.addEventListener('click', function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        location.href = 'index.html?entered=1';
      }
    });
    document.body.append(btn);
  }

  // ---------- 页面切换过渡 ----------
  function buildTransition() {
    if (document.getElementById('pageTransition')) return;
    const t = document.createElement('div');
    t.id = 'pageTransition';
    document.body.append(t);
  }

  function navigateTo(url) {
    const t = document.getElementById('pageTransition');
    // 跳回首页时带上标记，首页据此跳过“进入”遮罩，避免被全屏视频盖住
    if (/index\.html(\?|$)/.test(url) || url === '/' || url === '') {
      url = url === '/' || url === '' ? 'index.html?entered=1'
        : url + (url.indexOf('?') === -1 ? '?entered=1' : '&entered=1');
    }
    if (!t) { location.href = url; return; }
    t.classList.add('is-active');
    setTimeout(() => { location.href = url; }, 420);
  }

  // 拦截站内链接，做淡出过渡
  function hookLinks() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      // 只接管同站普通跳转（不是锚点、不是新窗口、不是外链）
      if (href.startsWith('#') || href.startsWith('http') || a.target === '_blank') return;
      if (!/\.html(\?|$)/.test(href) && href !== '/') return;
      e.preventDefault();
      navigateTo(href);
    });
  }

  // ---------- 滚动视差 ----------
  function initParallax() {
    const bands = document.querySelectorAll('.parallax-band');
    if (!bands.length) return;
    let ticking = false;
    function update() {
      const vh = window.innerHeight;
      bands.forEach((band) => {
        const img = band.querySelector('.parallax-band__img');
        if (!img) return;
        const rect = band.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh; // -1..1 左右
        const shift = progress * -60; // 上下缓缓移动
        img.style.transform = 'translateY(' + shift.toFixed(1) + 'px)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function initAll() {
    buildTools();
    buildBackButton();
    buildTransition();
    hookLinks();
    initParallax();
    // 进入页面时若过渡层残留，淡出
    const t = document.getElementById('pageTransition');
    if (t) requestAnimationFrame(() => t.classList.remove('is-active'));
  }

  // 双保险：脚本在body末尾，DOMContentLoaded 可能已触发过
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
