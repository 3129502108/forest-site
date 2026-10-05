// ============================================================
// 内页通用脚本
// ============================================================

// 备注提示条：在 URL 后加 ?clean=1 即可隐藏（用于正式发布前预览）
(function () {
  if (new URLSearchParams(location.search).get('clean') === '1') {
    document.querySelectorAll('[data-hint]').forEach(el => el.remove());
  }
})();

// 键盘快捷键：按 Esc 返回首页
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') location.href = 'index.html';
});
