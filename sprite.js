/* ============================================================
   森林小精灵 · Forest Sprite（精简版）
   一个小树造型的小精灵：出现在所有页面，可拖动、可点摸，记住位置
   ============================================================ */
(function () {
  if (window.__fspLoaded) return;
  window.__fspLoaded = true;

  var SIZE = 56;
  var STORE_KEY = 'fsp-pos-v1';

  function treeSVG() {
    return (
      '<svg viewBox="0 0 64 64" width="56" height="56" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<linearGradient id="fspLeaf" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#8ef0c2"/>' +
      '<stop offset="0.55" stop-color="#34d1a3"/>' +
      '<stop offset="1" stop-color="#1c8f6a"/>' +
      '</linearGradient>' +
      '<linearGradient id="fspTrunk" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#7bd6a9"/>' +
      '<stop offset="1" stop-color="#2f9c73"/>' +
      '</linearGradient>' +
      '</defs>' +
      '<rect x="29" y="38" width="6" height="18" rx="3" fill="url(#fspTrunk)"/>' +
      '<path d="M32 6 L46 26 L18 26 Z" fill="url(#fspLeaf)"/>' +
      '<path d="M32 16 L50 38 L14 38 Z" fill="url(#fspLeaf)"/>' +
      '<path d="M32 28 L48 46 L16 46 Z" fill="url(#fspLeaf)"/>' +
      '<circle cx="27" cy="20" r="3.2" fill="#d6ffe9" opacity=".6"/>' +
      '<g class="fsp__eye-open">' +
      '<circle cx="27" cy="36" r="2.4" fill="#0a1a12"/>' +
      '<circle cx="37" cy="36" r="2.4" fill="#0a1a12"/>' +
      '<circle cx="27.8" cy="35.2" r="0.8" fill="#eafff5"/>' +
      '<circle cx="37.8" cy="35.2" r="0.8" fill="#eafff5"/>' +
      '</g>' +
      '<circle cx="22" cy="40" r="2" fill="#7df3c0" opacity=".5"/>' +
      '<circle cx="42" cy="40" r="2" fill="#7df3c0" opacity=".5"/>' +
      '</svg>'
    );
  }

  var el = document.createElement('div');
  el.className = 'fsp';
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', '森林小精灵');
  el.innerHTML = '<div class="fsp__glow"></div><div class="fsp__body">' + treeSVG() + '</div>';

  var curX = 0, curY = 0, restored = false;

  function setPos(x, y) {
    var maxX = window.innerWidth - SIZE - 4;
    var maxY = window.innerHeight - SIZE - 4;
    curX = Math.max(4, Math.min(maxX, x));
    curY = Math.max(4, Math.min(maxY, y));
    el.style.transform = 'translate(' + curX + 'px,' + curY + 'px)';
  }
  function defaultPos() {
    setPos(window.innerWidth - SIZE - 24, window.innerHeight - SIZE - 24);
  }
  function savePos() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ x: curX, y: curY })); } catch (e) {}
  }
  function restorePos() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (s && typeof s.x === 'number') { restored = true; setPos(s.x, s.y); return true; }
    } catch (e) {}
    return false;
  }

  // 被点/被摸：轻轻晃一下
  function pat() {
    el.classList.add('is-pat');
    setTimeout(function () { el.classList.remove('is-pat'); }, 520);
  }

  // 拖拽
  var dragging = false, moved = false, offX = 0, offY = 0;

  function point(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }
  function down(e) {
    dragging = true; moved = false;
    var p = point(e);
    offX = p.x - curX; offY = p.y - curY;
    el.setPointerCapture && e.pointerId != null && el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function move(e) {
    if (!dragging) return;
    var p = point(e);
    if (Math.abs(p.x - (curX + offX)) > 3 || Math.abs(p.y - (curY + offY)) > 3) moved = true;
    setPos(p.x - offX, p.y - offY);
    e.preventDefault();
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    if (moved) savePos(); else pat();
  }

  function mount() {
    document.body.appendChild(el);
    if (!restorePos()) defaultPos();
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    if (!window.PointerEvent) {
      el.addEventListener('touchstart', down, { passive: false });
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', up);
    }
    window.addEventListener('resize', function () { setPos(curX, curY); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
