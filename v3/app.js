(() => {
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  // boot / VHS splash
  const boot = document.getElementById('boot');
  const bootLog = document.getElementById('boot-log');
  if (boot && bootLog && !prefersReduce) {
    const lines = [
      'RJ.OS BIOS v0.3',
      'Checking memory …… OK',
      'Mounting C:\\RiasJ1Dar …… OK',
      'Loading VHS overlay …… OK',
      'Starting desktop shell …',
    ];
    let i = 0;
    bootLog.textContent = '';
    const tick = () => {
      if (i < lines.length) {
        bootLog.textContent += lines[i] + '\n';
        i += 1;
        setTimeout(tick, 180);
      } else {
        setTimeout(() => {
          boot.classList.add('is-done');
          boot.setAttribute('hidden', '');
          document.body.classList.add('glitch-burst');
          setTimeout(() => document.body.classList.remove('glitch-burst'), 500);
        }, 280);
      }
    };
    tick();
  } else if (boot) {
    boot.classList.add('is-done');
    boot.setAttribute('hidden', '');
  }

  // occasional glitch burst
  if (!prefersReduce) {
    setInterval(() => {
      if (Math.random() > 0.35) return;
      document.body.classList.add('glitch-burst');
      setTimeout(() => document.body.classList.remove('glitch-burst'), 280);
    }, 9000);
  }

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
  const tasks = [...document.querySelectorAll('.task[data-win]')];

  const isMobile = () => window.matchMedia('(max-width: 959px)').matches;

  const place = (win) => {
    const x = Number(win.dataset.x || 40);
    const y = Number(win.dataset.y || 40);
    const w = Number(win.dataset.w || 480);
    win.style.position = 'absolute';
    win.style.width = `${Math.min(w, window.innerWidth - 24)}px`;
    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
  };

  const fitDesk = () => {
    if (!desk || isMobile()) return;
    let bottom = window.innerHeight - 40;
    windows.forEach((win) => {
      const top = parseFloat(win.style.top) || Number(win.dataset.y) || 0;
      bottom = Math.max(bottom, top + win.offsetHeight + 56);
    });
    // cap runaway growth
    desk.style.minHeight = `${Math.min(bottom, 2400)}px`;
  };

  const layout = () => {
    if (!desk) return;
    const mobile = isMobile();
    desk.classList.toggle('is-mobile', mobile);
    if (mobile) {
      windows.forEach((win) => {
        win.style.left = '';
        win.style.top = '';
        win.style.width = '';
        win.style.position = '';
      });
      desk.style.minHeight = '';
      return;
    }
    windows.forEach(place);
    fitDesk();
  };

  const setActiveTask = (id) => {
    tasks.forEach((t) => t.classList.toggle('is-active', t.dataset.win === id));
  };

  const focus = (win, { flash = false } = {}) => {
    if (!win) return;
    z += 1;
    win.style.zIndex = String(z);
    win.hidden = false;
    setActiveTask(win.id);
    if (flash) {
      win.classList.remove('focus-flash');
      void win.offsetWidth;
      win.classList.add('focus-flash');
      setTimeout(() => win.classList.remove('focus-flash'), 700);
    }
  };

  const ensureDesktopMode = () => {
    if (!desk) return;
    if (desk.classList.contains('is-mobile')) {
      desk.classList.remove('is-mobile');
      windows.forEach(place);
      fitDesk();
    }
  };

  const bringToView = (win) => {
    ensureDesktopMode();
    place(win);
    // if window is below fold, nudge up instead of growing page via hash scroll
    const top = parseFloat(win.style.top) || 0;
    const limit = Math.max(40, window.innerHeight - win.offsetHeight - 48);
    if (top > limit) {
      const ny = Math.max(36, limit * 0.35);
      win.style.top = `${ny}px`;
      win.dataset.y = String(Math.round(ny));
    }
    focus(win, { flash: true });
    // soft scroll so titlebar is visible, without jumping to document end
    const rect = win.getBoundingClientRect();
    if (rect.top < 8 || rect.bottom > window.innerHeight - 40) {
      const y = window.scrollY + rect.top - 24;
      window.scrollTo({ top: Math.max(0, y), behavior: prefersReduce ? 'auto' : 'smooth' });
    }
  };

  tasks.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const win = document.getElementById(btn.dataset.win);
      if (!win) return;
      bringToView(win);
    });
  });

  // Start menu links that point to windows
  menu?.querySelectorAll('a[href^="#win-"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href')?.slice(1);
      const win = id && document.getElementById(id);
      toggle(false);
      if (win) bringToView(win);
    });
  });

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
      const maxY = Math.max(8, window.innerHeight - 48);
      nx = Math.min(Math.max(0, nx), maxX);
      ny = Math.min(Math.max(0, ny), maxY);
      win.style.left = `${nx}px`;
      win.style.top = `${ny}px`;
      win.dataset.x = String(Math.round(nx));
      win.dataset.y = String(Math.round(ny));
    };

    const startDrag = (clientX, clientY) => {
      ensureDesktopMode();
      focus(win);
      dragging = true;
      win.classList.add('dragging');
      const rect = win.getBoundingClientRect();
      ox = clientX - rect.left;
      oy = clientY - rect.top;
    };

    const end = () => {
      if (!dragging) return;
      dragging = false;
      win.classList.remove('dragging');
      fitDesk();
    };

    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.controls')) return;
      e.preventDefault();
      bar.setPointerCapture(e.pointerId);
      startDrag(e.clientX, e.clientY);
    });
    bar.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY));
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  });

  // kill hash jump growth if user somehow lands with hash
  if (location.hash.startsWith('#win-')) {
    const win = document.getElementById(location.hash.slice(1));
    history.replaceState(null, '', location.pathname + location.search);
    if (win) setTimeout(() => bringToView(win), 0);
  }

  
  document.querySelectorAll('a[data-win], button[data-win]').forEach((el) => {
    if (el.classList.contains('task')) return;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const win = document.getElementById(el.dataset.win);
      if (win) bringToView(win);
    });
  });

  layout();
  window.addEventListener('resize', layout);
})();
