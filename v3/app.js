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

  const boot = document.getElementById('boot');
  const bootLog = document.getElementById('boot-log');
  if (boot && bootLog && !prefersReduce) {
    const lines = [
      'RJ.OS BIOS v0.5',
      'Checking memory …… OK',
      'Mounting C:\\RiasJiDar …… OK',
      'Starting desktop shell …',
    ];
    let i = 0;
    bootLog.textContent = '';
    const tick = () => {
      if (i < lines.length) {
        bootLog.textContent += `${lines[i]}\n`;
        i += 1;
        setTimeout(tick, 160);
      } else {
        setTimeout(() => {
          boot.classList.add('is-done');
          boot.setAttribute('hidden', '');
        }, 220);
      }
    };
    tick();
  } else if (boot) {
    boot.classList.add('is-done');
    boot.setAttribute('hidden', '');
  }

  const desk = document.getElementById('desk');
  const menu = document.getElementById('start-menu');
  const tasksEl = document.getElementById('tasks');
  const startBtn = document.getElementById('task-start');
  const shutdownEl = document.getElementById('shutdown');

  const toggleMenu = (open) => {
    if (!menu) return;
    const next = open ?? menu.hasAttribute('hidden');
    if (next) menu.removeAttribute('hidden');
    else menu.setAttribute('hidden', '');
    startBtn?.setAttribute('aria-expanded', String(next));
  };
  startBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });
  document.addEventListener('click', () => toggleMenu(false));
  menu?.addEventListener('click', (e) => e.stopPropagation());

  let z = 20;
  /** @type {Set<string>} window ids that are minimized (hidden but still on taskbar) */
  const minimized = new Set();

  const isMobile = () => window.matchMedia('(max-width: 959px)').matches;
  const allWindows = () => [...document.querySelectorAll('.desktop > .window')];
  const visibleWindows = () => allWindows().filter((w) => !w.hidden);
  const winTitle = (win) => win.dataset.title || win.querySelector('.title')?.textContent?.trim() || win.id;

  const taskbarIds = () => {
    const ids = new Set(visibleWindows().map((w) => w.id));
    minimized.forEach((id) => ids.add(id));
    return ids;
  };

  const syncTasks = () => {
    if (!tasksEl) return;
    const focused = document.querySelector('.desktop > .window.is-focus:not([hidden])');
    const focusedId = focused?.id || '';
    const want = taskbarIds();
    const existing = new Map([...tasksEl.querySelectorAll('.task')].map((b) => [b.dataset.win, b]));

    existing.forEach((btn, id) => {
      if (!want.has(id)) btn.remove();
    });

    want.forEach((id) => {
      const win = document.getElementById(id);
      if (!win) return;
      let btn = existing.get(id);
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'task';
        btn.dataset.win = id;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          restore(win);
        });
        tasksEl.appendChild(btn);
      }
      btn.textContent = winTitle(win);
      btn.classList.toggle('is-active', id === focusedId && !minimized.has(id));
    });

    document.querySelectorAll('.icon[data-win]').forEach((icon) => {
      icon.classList.toggle('is-active', icon.dataset.win === focusedId);
    });
  };

  const place = (win) => {
    if (isMobile()) return;
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
    visibleWindows().forEach((win) => {
      const top = parseFloat(win.style.top) || Number(win.dataset.y) || 0;
      bottom = Math.max(bottom, top + win.offsetHeight + 56);
    });
    desk.style.minHeight = `${Math.min(bottom, 2400)}px`;
  };

  const applyMobileFront = (win) => {
    allWindows().forEach((w) => w.classList.toggle('is-front', w === win && !w.hidden));
  };

  const setFocusChrome = (win) => {
    allWindows().forEach((w) => w.classList.toggle('is-focus', w === win && !w.hidden));
    if (isMobile() && win && !win.hidden) applyMobileFront(win);
    else if (isMobile()) allWindows().forEach((w) => w.classList.remove('is-front'));
    syncTasks();
  };

  const focusTopVisible = () => {
    const remaining = visibleWindows();
    if (!remaining.length) {
      allWindows().forEach((w) => w.classList.remove('is-focus', 'is-front'));
      syncTasks();
      return;
    }
    const top = remaining.reduce((a, b) => (
      parseInt(a.style.zIndex || '0', 10) >= parseInt(b.style.zIndex || '0', 10) ? a : b
    ));
    setFocusChrome(top);
  };

  const focus = (win, { flash = false } = {}) => {
    if (!win || win.hidden) return;
    z += 1;
    win.style.zIndex = String(z);
    setFocusChrome(win);
    if (flash) {
      win.classList.remove('focus-flash');
      void win.offsetWidth;
      win.classList.add('focus-flash');
      setTimeout(() => win.classList.remove('focus-flash'), 700);
    }
  };

  const openWin = (win, { flash = true } = {}) => {
    if (!win) return;
    minimized.delete(win.id);
    win.hidden = false;
    if (!isMobile()) place(win);
    z += 1;
    win.style.zIndex = String(z);
    setFocusChrome(win);
    if (flash) {
      win.classList.remove('focus-flash');
      void win.offsetWidth;
      win.classList.add('focus-flash');
      setTimeout(() => win.classList.remove('focus-flash'), 700);
    }
    if (!isMobile()) {
      const rect = win.getBoundingClientRect();
      if (rect.top < 8 || rect.bottom > window.innerHeight - 40) {
        const y = window.scrollY + rect.top - 24;
        window.scrollTo({ top: Math.max(0, y), behavior: prefersReduce ? 'auto' : 'smooth' });
      }
      fitDesk();
    }
    if (win.id === 'win-terminal') {
      setTimeout(() => document.getElementById('term-input')?.focus(), 50);
    }
  };

  const restore = (win) => openWin(win, { flash: true });

  const closeWin = (win) => {
    if (!win) return;
    minimized.delete(win.id);
    win.hidden = true;
    win.classList.remove('is-focus', 'is-front');
    focusTopVisible();
  };

  const minimizeWin = (win) => {
    if (!win) return;
    minimized.add(win.id);
    win.hidden = true;
    win.classList.remove('is-focus', 'is-front');
    focusTopVisible();
  };

  const openById = (id) => {
    const win = document.getElementById(id);
    if (win) openWin(win);
  };

  const isExternalHttp = (el) => {
    if (!(el instanceof HTMLAnchorElement)) return false;
    const href = el.getAttribute('href') || '';
    return /^https?:\/\//i.test(href) || href.startsWith('//');
  };

  /* Open-window triggers — never block real http(s) anchors */
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href]');
    if (anchor && isExternalHttp(anchor)) return;

    const opener = e.target.closest('[data-win]');
    if (!opener) return;
    if (isExternalHttp(opener)) return;

    e.preventDefault();
    e.stopPropagation();
    if (opener.closest('#start-menu')) toggleMenu(false);
    openById(opener.dataset.win);
  });

  allWindows().forEach((win) => {
    const bar = win.querySelector(':scope > .titlebar');
    win.addEventListener('mousedown', (e) => {
      if (e.target.closest('.controls')) return;
      if (!win.hidden) focus(win);
    });
    win.addEventListener('touchstart', () => {
      if (!win.hidden) focus(win);
    }, { passive: true });

    bar?.querySelector('.ctrl.x')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWin(win);
    });
    bar?.querySelector('.ctrl.min')?.addEventListener('click', (e) => {
      e.stopPropagation();
      minimizeWin(win);
    });

    if (!bar) return;

    let dragging = false;
    let ox = 0;
    let oy = 0;

    const onMove = (clientX, clientY) => {
      if (!dragging || isMobile()) return;
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
      if (isMobile()) {
        focus(win);
        return;
      }
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

  /* Explorer: double-click row opens GitHub link */
  document.querySelectorAll('#explorer-list tbody tr').forEach((row) => {
    row.addEventListener('dblclick', () => {
      const a = row.querySelector('a[href]');
      if (a && isExternalHttp(a)) {
        window.open(a.href, '_blank', 'noopener,noreferrer');
      }
    });
    row.addEventListener('click', () => {
      document.querySelectorAll('#explorer-list tr.is-selected').forEach((r) => r.classList.remove('is-selected'));
      row.classList.add('is-selected');
    });
  });

  const layout = () => {
    if (!desk) return;
    const mobile = isMobile();
    desk.classList.toggle('is-mobile', mobile);
    if (mobile) {
      allWindows().forEach((win) => {
        win.style.left = '';
        win.style.top = '';
        win.style.width = '';
        win.style.position = '';
      });
      desk.style.minHeight = '';
      const focused = document.querySelector('.desktop > .window.is-focus:not([hidden])')
        || visibleWindows()[0];
      if (focused) applyMobileFront(focused);
      syncTasks();
      return;
    }
    visibleWindows().forEach(place);
    fitDesk();
    syncTasks();
  };

  /* Never drive focus via location.hash (avoids page growth from hash scroll) */
  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }

  const initialFocus = document.getElementById('win-hero') || visibleWindows()[0];
  if (initialFocus) {
    initialFocus.hidden = false;
    setFocusChrome(initialFocus);
  }
  layout();
  window.addEventListener('resize', layout);

  /* —— Interactive Terminal —— */
  const SIGNAL_TOML = `$ cat signal.toml
[identity]
handle  = "RiasJiDar"
forge   = ["github", "gitlab"]

[stack]
lang    = ["rust", "python", "csharp"]
focus   = ["agents", "mcp", "windows"]
donate  = "monobank"

$ ./ship --public
Status::Mirrored ✓
Status::Public ✓`;

  const README_TXT = `RJ.OS :: README.txt
====================
Арсенал відкритих інструментів для автоматизації та AI.
Handle: RiasJiDar
Forge:  github.com/RiasJ1Dar
Donate: send.monobank.ua/jar/4XsDm8vmF2

Команди: help | ls | cat | donate | whoami | clear | neofetch`;

  const termOut = document.getElementById('term-out');
  const termForm = document.getElementById('term-form');
  const termInput = document.getElementById('term-input');

  const termPrint = (text) => {
    if (!termOut) return;
    termOut.textContent += (termOut.textContent ? '\n' : '') + text;
    termOut.scrollTop = termOut.scrollHeight;
  };

  const termClear = () => {
    if (termOut) termOut.textContent = '';
  };

  const initTerm = () => {
    termClear();
    termPrint(SIGNAL_TOML);
    termPrint('');
  };
  initTerm();

  const runCommand = (raw) => {
    const line = raw.trim();
    termPrint(`$ ${raw}`);
    if (!line) return;

    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
      case 'help':
        termPrint(`Доступні команди:
  help       — цей список
  clear      — очистити екран
  ls         — список файлів
  cat FILE   — показати файл (readme.txt, signal.toml)
  donate     — банка Monobank
  whoami     — хто я
  neofetch   — про систему
  about      — те саме, коротко
  exit       — закрити термінал`);
        break;
      case 'clear':
      case 'cls':
        termClear();
        break;
      case 'ls':
      case 'dir':
        termPrint(`signal.toml
readme.txt
manifesto.exe
projects/
donate.url`);
        break;
      case 'cat': {
        const file = arg.toLowerCase();
        if (!file) {
          termPrint('cat: вкажіть файл (напр. cat readme.txt)');
        } else if (file === 'readme.txt' || file === 'readme') {
          termPrint(README_TXT);
        } else if (file === 'signal.toml' || file === 'signal') {
          termPrint(`[identity]
handle  = "RiasJiDar"
forge   = ["github", "gitlab"]

[stack]
lang    = ["rust", "python", "csharp"]
focus   = ["agents", "mcp", "windows"]
donate  = "monobank"`);
        } else {
          termPrint(`cat: ${arg}: немає такого файла`);
        }
        break;
      }
      case 'donate':
        termPrint('Банка Monobank:\nhttps://send.monobank.ua/jar/4XsDm8vmF2');
        break;
      case 'whoami':
        termPrint('RiasJiDar');
        break;
      case 'neofetch':
      case 'about':
        termPrint(`         .-/+oossssoo+/-.
     RJ.OS 0.5 / Win95 Deck
     Host:    RiasJiDar
     Shell:   signal.sh
     Stack:   rust · python · csharp
     Focus:   agents · mcp · windows
     Donate:  monobank jar
     Uptime:  since you opened this tab`);
        break;
      case 'exit':
      case 'quit':
        closeWin(document.getElementById('win-terminal'));
        break;
      default:
        termPrint(`signal.sh: команду «${cmd}» не розпізнано. Введіть help.`);
    }
  };

  termForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = termInput?.value ?? '';
    if (termInput) termInput.value = '';
    runCommand(val);
  });

  /* —— Shut Down —— */
  const powerOff = () => {
    toggleMenu(false);
    if (!shutdownEl) return;
    shutdownEl.hidden = false;
  };
  const powerOn = () => {
    if (!shutdownEl || shutdownEl.hidden) return;
    shutdownEl.hidden = true;
  };
  document.getElementById('btn-shutdown')?.addEventListener('click', (e) => {
    e.stopPropagation();
    powerOff();
  });
  shutdownEl?.addEventListener('click', powerOn);
  document.addEventListener('keydown', (e) => {
    if (shutdownEl && !shutdownEl.hidden) {
      e.preventDefault();
      powerOn();
    }
  });
})();
