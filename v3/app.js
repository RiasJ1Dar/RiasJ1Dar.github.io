(() => {
  const pads = (n) => String(n).padStart(2, '0');
  const paintClock = () => {
    const d = new Date();
    const t = `${pads(d.getHours())}:${pads(d.getMinutes())}`;
    document.querySelectorAll('#clock, #clock2').forEach((el) => {
      el.textContent = t;
      if ('dateTime' in el) el.dateTime = d.toISOString();
    });
  };
  paintClock();
  setInterval(paintClock, 1000);

  const desk = document.getElementById('desk');
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

  let z = 20;
  const windows = [...document.querySelectorAll('.desktop > .window')];

  const isMobile = () => window.matchMedia('(max-width: 959px)').matches;

  const place = (win) => {
    const x = Number(win.dataset.x || 40);
    const y = Number(win.dataset.y || 40);
    const w = Number(win.dataset.w || 480);
    win.style.width = `${Math.min(w, window.innerWidth - 24)}px`;
    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
  };

  const layout = () => {
    if (!desk) return;
    desk.classList.toggle('is-mobile', isMobile());
    if (isMobile()) {
      windows.forEach((win) => {
        win.style.left = '';
        win.style.top = '';
        win.style.width = '';
      });
      return;
    }
    windows.forEach(place);
    // grow desktop to fit lowest window
    let bottom = 800;
    windows.forEach((win) => {
      const top = parseFloat(win.style.top) || 0;
      bottom = Math.max(bottom, top + win.offsetHeight + 48);
    });
    desk.style.minHeight = `${bottom}px`;
  };

  const focus = (win) => {
    z += 1;
    win.style.zIndex = String(z);
  };

  windows.forEach((win) => {
    const bar = win.querySelector(':scope > .titlebar');
    win.addEventListener('mousedown', () => focus(win));
    win.addEventListener('touchstart', () => focus(win), { passive: true });

    if (!bar) return;

    let dragging = false;
    let ox = 0;
    let oy = 0;

    const onMove = (clientX, clientY) => {
      if (!dragging) return;
      let nx = clientX - ox;
      let ny = clientY - oy;
      const maxX = Math.max(8, window.innerWidth - win.offsetWidth - 8);
      const maxY = Math.max(8, (desk?.offsetHeight || window.innerHeight) - 40);
      nx = Math.min(Math.max(8, nx), maxX);
      ny = Math.min(Math.max(8, ny), maxY);
      win.style.left = `${nx}px`;
      win.style.top = `${ny}px`;
      win.dataset.x = String(Math.round(nx));
      win.dataset.y = String(Math.round(ny));
    };

    const start = (clientX, clientY) => {
      // if currently stacked mobile, switch this window to absolute drag
      if (isMobile()) {
        desk?.classList.remove('is-mobile');
        const rect = win.getBoundingClientRect();
        const deskRect = desk.getBoundingClientRect();
        win.style.position = 'absolute';
        win.style.width = `${Math.min(win.offsetWidth, window.innerWidth - 24)}px`;
        win.style.left = `${rect.left - deskRect.left}px`;
        win.style.top = `${rect.top - deskRect.top + desk.scrollTop}px`;
        windows.forEach((other) => {
          if (other === win) return;
          if (!other.style.left) place(other);
        });
      }
      focus(win);
      dragging = true;
      win.classList.add('dragging');
      const rect = win.getBoundingClientRect();
      ox = clientX - rect.left;
      oy = clientY - rect.top;
    };

    const end = () => {
      dragging = false;
      win.classList.remove('dragging');
    };

    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.controls')) return;
      e.preventDefault();
      bar.setPointerCapture(e.pointerId);
      start(e.clientX, e.clientY);
    });
    bar.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY));
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  });

  layout();
  window.addEventListener('resize', layout);
})();
