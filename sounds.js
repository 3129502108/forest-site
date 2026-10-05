// ============================================================
// 森林之声 · 音频播放（纯前端，单曲互斥，自动循环）
// ============================================================

(function () {
  const cards = document.querySelectorAll('.sound-card');
  if (!cards.length) return;

  let current = null; // 当前 playing 的 <audio>

  cards.forEach((card) => {
    const src = card.dataset.sound;
    const label = card.dataset.label;

    card.addEventListener('click', () => {
      const state = card.querySelector('.sound-card__state');

      // 再次点击正在播放的 → 暂停
      if (card.classList.contains('is-playing')) {
        current && current.pause();
        card.classList.remove('is-playing');
        state.textContent = '点击播放';
        current = null;
        return;
      }

      // 停掉其它正在播放的
      document.querySelectorAll('.sound-card').forEach((c) => {
        if (c !== card) {
          c.classList.remove('is-playing');
          c.classList.remove('is-error');
          const s = c.querySelector('.sound-card__state');
          if (s) s.textContent = '点击播放';
        }
      });
      if (current) { current.pause(); current = null; }

      // 播放当前
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0.7;
      card.classList.add('is-playing');
      state.textContent = '播放中… ' + label;

      audio.addEventListener('error', () => {
        card.classList.remove('is-playing');
        card.classList.add('is-error');
        state.textContent = '音频还没放进来';
      });

      audio.play().then(() => {
        current = audio;
      }).catch(() => {
        card.classList.remove('is-playing');
        card.classList.add('is-error');
        state.textContent = '无法播放（文件缺失或浏览器限制）';
      });
    });
  });
})();
