(() => {
  // subtle live clock in manifesto terminal bar if present
  const bar = document.querySelector('.term-bar b');
  if (!bar) return;
  const tick = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    bar.textContent = `[${hh}:${mm}:${ss}]`;
  };
  tick();
  setInterval(tick, 1000);
})();
