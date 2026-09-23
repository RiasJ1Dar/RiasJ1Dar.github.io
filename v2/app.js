(() => {
  const progress = document.querySelector('.rail-progress');
  const meter = document.querySelector('.dock-meter i');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.width = `${Math.min(100, p * 100)}%`;
    if (meter) meter.style.height = `${18 + p * 70}%`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // soft pointer glow on tiles
  document.querySelectorAll('[data-glow]').forEach((tile) => {
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      tile.style.setProperty('--mx', `${x}%`);
      tile.style.setProperty('--my', `${y}%`);
      tile.style.background = `radial-gradient(420px circle at ${x}% ${y}%, rgba(232,121,249,.18), transparent 40%), rgba(28,16,48,.55)`;
    });
    tile.addEventListener('pointerleave', () => {
      tile.style.background = '';
    });
  });

  // magnetic primary buttons
  document.querySelectorAll('.btn.primary').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.18;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  });
})();
