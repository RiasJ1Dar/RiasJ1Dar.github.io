(() => {
  const pads = (n) => String(n).padStart(2, '0');
  const paintClock = () => {
    const d = new Date();
    const t = `${pads(d.getHours())}:${pads(d.getMinutes())}`;
    document.querySelectorAll('#clock, #clock2').forEach((el) => {
      el.textContent = t;
      if (el.dateTime !== undefined) el.dateTime = d.toISOString();
    });
  };
  paintClock();
  setInterval(paintClock, 1000);

  const menu = document.getElementById('start-menu');
  const buttons = [document.getElementById('task-start'), document.getElementById('start-btn')].filter(Boolean);
  const toggle = (open) => {
    if (!menu) return;
    const next = open ?? menu.hasAttribute('hidden');
    if (next) menu.removeAttribute('hidden');
    else menu.setAttribute('hidden', '');
    buttons.forEach((b) => b.setAttribute('aria-expanded', String(next)));
  };
  buttons.forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  }));
  document.addEventListener('click', () => toggle(false));
  menu?.addEventListener('click', (e) => e.stopPropagation());
  menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggle(false)));

  // focus window on click (z-index bump)
  let z = 10;
  document.querySelectorAll('.window').forEach((win) => {
    win.addEventListener('mousedown', () => {
      z += 1;
      win.style.zIndex = String(z);
    });
  });
})();
