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
  /* Close only on outside tap — do NOT stopPropagation on the whole menu,
     or [data-win] buttons never reach the document opener (broken on phones). */
  document.addEventListener('click', (e) => {
    if (!menu || menu.hasAttribute('hidden')) return;
    if (e.target.closest('#start-menu') || e.target.closest('#task-start')) return;
    toggleMenu(false);
  });

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

  /* Explorer: live public repos from GitHub API + static fallback */
  const GH_OWNER = 'RiasJ1Dar';
  const GH_REPOS_URL = `https://api.github.com/users/${GH_OWNER}/repos?per_page=100&sort=updated&type=owner`;
  const RELEASE_CACHE_KEY = 'rj_gh_releases_v1';
  const RELEASE_CACHE_TTL_MS = 60 * 60 * 1000;
  const MAX_RELEASE_FETCH = 20;
  const EXPLORER_PATH_DEFAULT = 'C:\\RiasJiDar\\Public\\';

  const explorerList = document.getElementById('explorer-list');
  const explorerTbody = document.getElementById('explorer-tbody')
    || explorerList?.querySelector('tbody');
  const explorerPath = document.getElementById('explorer-path');
  const explorerFallbackHtml = explorerTbody ? explorerTbody.innerHTML : '';

  const escHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const setExplorerPath = (msg) => {
    if (explorerPath) explorerPath.textContent = msg;
  };

  const flashExplorerNote = (note, ms = 4000) => {
    setExplorerPath(`${EXPLORER_PATH_DEFAULT}  [${note}]`);
    setTimeout(() => setExplorerPath(EXPLORER_PATH_DEFAULT), ms);
  };

  const bindExplorerSelection = () => {
    if (!explorerList || explorerList.dataset.bound === '1') return;
    explorerList.dataset.bound = '1';
    explorerList.addEventListener('click', (e) => {
      const row = e.target.closest('tbody tr');
      if (!row || !explorerList.contains(row)) return;
      explorerList.querySelectorAll('tr.is-selected').forEach((r) => r.classList.remove('is-selected'));
      row.classList.add('is-selected');
    });
    explorerList.addEventListener('dblclick', (e) => {
      const row = e.target.closest('tbody tr');
      if (!row || !explorerList.contains(row)) return;
      const a = row.querySelector('a[href]');
      if (a && isExternalHttp(a)) {
        window.open(a.href, '_blank', 'noopener,noreferrer');
      }
    });
  };

  const isListedRepo = (repo) => {
    if (!repo || typeof repo.name !== 'string' || !repo.name.trim()) return false;
    if (repo.fork || repo.archived) return false;
    const n = repo.name.toLowerCase();
    if (n === 'riasj1dar.github.io') return false;
    if (n === 'riasj1dar') return false; // профільний README (special repo = username)
    if (n === '.github') return false;
    return true;
  };

  const loadReleaseCache = () => {
    try {
      const raw = sessionStorage.getItem(RELEASE_CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data.ts !== 'number' || !data.map) return null;
      if (Date.now() - data.ts > RELEASE_CACHE_TTL_MS) return null;
      return data.map;
    } catch {
      return null;
    }
  };

  const saveReleaseCache = (map) => {
    try {
      sessionStorage.setItem(RELEASE_CACHE_KEY, JSON.stringify({ ts: Date.now(), map }));
    } catch { /* ignore quota */ }
  };

  const fetchLatestRelease = async (name) => {
    const url = `https://api.github.com/repos/${GH_OWNER}/${encodeURIComponent(name)}/releases/latest`;
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (res.status === 404) return { ok: true, release: null };
      if (!res.ok) return { ok: false, release: null };
      const data = await res.json();
      const tag = data.tag_name || data.name;
      const htmlUrl = data.html_url;
      if (!tag || !htmlUrl) return { ok: true, release: null };
      return { ok: true, release: { tag: String(tag), html_url: String(htmlUrl) } };
    } catch {
      return { ok: false, release: null };
    }
  };

  const resolveReleases = async (repos) => {
    const cached = loadReleaseCache() || {};
    const map = { ...cached };
    const need = repos
      .map((r) => r.name)
      .filter((n) => !(n in map))
      .slice(0, MAX_RELEASE_FETCH);
    if (need.length) {
      const results = await Promise.allSettled(need.map((n) => fetchLatestRelease(n)));
      let wrote = false;
      need.forEach((n, i) => {
        const r = results[i];
        if (r.status !== 'fulfilled' || !r.value || !r.value.ok) return;
        map[n] = r.value.release;
        wrote = true;
      });
      if (wrote) saveReleaseCache(map);
    }
    return map;
  };

  const renderExplorerRows = (repos, releases) => {
    if (!explorerTbody) return;
    if (!repos.length) {
      explorerTbody.innerHTML = '<tr><td colspan="4">Немає публічних репозиторіїв</td></tr>';
      return;
    }
    explorerTbody.innerHTML = repos.map((repo) => {
      const name = escHtml(repo.name);
      const href = escHtml(repo.html_url || `https://github.com/${GH_OWNER}/${repo.name}`);
      const lang = escHtml(repo.language || '—');
      const desc = escHtml((repo.description && String(repo.description).trim()) || 'публічний репозиторій');
      const rel = releases[repo.name];
      let releaseCell = '—';
      if (rel && rel.tag && rel.html_url) {
        releaseCell = `<a href="${escHtml(rel.html_url)}" target="_blank" rel="noopener noreferrer">${escHtml(rel.tag)}</a>`;
      }
      return `<tr><td><a href="${href}" target="_blank" rel="noopener noreferrer">${name}</a></td><td>${lang}</td><td>${desc}</td><td>${releaseCell}</td></tr>`;
    }).join('');
  };

  const showExplorerLoading = () => {
    if (!explorerTbody) return;
    explorerTbody.innerHTML = '<tr><td colspan="4">Завантаження з GitHub…</td></tr>';
    setExplorerPath(`${EXPLORER_PATH_DEFAULT}  [Завантаження з GitHub…]`);
  };

  const showExplorerFallback = (reason) => {
    if (!explorerTbody) return;
    explorerTbody.innerHTML = explorerFallbackHtml;
    flashExplorerNote(reason || 'офлайн-список');
  };

  const loadExplorerFromGitHub = async () => {
    if (!explorerTbody) return;
    showExplorerLoading();
    try {
      const res = await fetch(GH_REPOS_URL, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) {
        showExplorerFallback(res.status === 403 ? 'офлайн-список · rate limit' : 'офлайн-список');
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        showExplorerFallback('офлайн-список');
        return;
      }
      const repos = data
        .filter(isListedRepo)
        .sort((a, b) => String(b.pushed_at || '').localeCompare(String(a.pushed_at || '')));
      const releases = await resolveReleases(repos);
      renderExplorerRows(repos, releases);
      setExplorerPath(EXPLORER_PATH_DEFAULT);
    } catch {
      showExplorerFallback('офлайн-список');
    }
  };

  bindExplorerSelection();
  loadExplorerFromGitHub();


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
projects/   ← живий список з GitHub API (вікно Explorer)
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
        termPrint(`         .-/+oossssoo+/-.
     RJ.OS 0.5 / Win95 Deck
     Host:    RiasJiDar
     Shell:   signal.sh
     Stack:   rust · python · csharp
     Focus:   agents · mcp · windows
     Donate:  monobank jar
     Uptime:  since you opened this tab`);
        break;
      case 'about':
        termPrint('RJ.OS 0.5 — RiasJiDar · rust/python/csharp · agents/mcp/windows');
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
