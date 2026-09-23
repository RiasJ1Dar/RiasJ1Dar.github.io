const cases={
exchange:{name:'agent-exchange',type:'RUST / SQLITE / MCP',problem:'Два агенти працюють над одним кодом, але не бачать сесій одне одного. Через це зміни можуть дублюватися або конфліктувати.',solution:'MCP-сервер зберігає повідомлення й замки на теми у SQLite. Людина бачить стан у NOW.md та локальному вікні тільки для читання.',decision:'Сервер змінює лише позначені блоки NOW.md. Рукописний текст поза ними зберігається.',top:[['Агент A','MCP-клієнт'],['Агент B','MCP-клієнт']],core:['exchange-mcp','пошта · замки · render'],bottom:[['SQLite','спільний стан'],['NOW.md','дошка для людини'],['Web UI','тільки читання']],transport:'stdio / JSON-RPC',output:'збереження та відображення',caption:'Спрощено за README: спільне сховище координує роботу агентів, а дошка та UI роблять її видимою людині.',links:[['Репозиторій','agent-exchange'],['Повна схема','agent-exchange/blob/main/docs/architecture.md']]},
downloader:{name:'Downloader',type:'RUST / C# / AVALONIA',problem:'Завантаження мають продовжуватися після обривів і закриття вікна. Різні протоколи потребують спільної черги й керування.',solution:'Окремий процес ядра керує чергою. Вікно, CLI та браузерне розширення звертаються до нього через локальний канал; протоколи підключаються через контракт Protocol.',decision:'Спочатку дані записуються й синхронізуються, потім зберігається стан. Це допомагає коректно відновити завантаження після збою.',top:[['Avalonia / CLI','інтерфейси'],['Розширення','через nmhost']],core:['Rust core-service','черга · планувальник · події'],bottom:[['HTTP','сегменти / resume'],['HLS / DASH','потоки й доріжки'],['yt-dlp','YouTube']],transport:'локальний IPC',output:'контракт Protocol',caption:'Спрощено за README. ffmpeg використовується окремим процесом для зведення доріжок і роботи з контейнерами.',links:[['Репозиторій','downloader'],['Повна схема','downloader/blob/master/docs/architecture.json']]},
antigravity:{name:'Antigravity UA',type:'JAVASCRIPT / C# / PYTHON',problem:'Український інтерфейс IDE має перекладати елементи керування, зберігаючи код, термінал, користувацький ввід та іконки.',solution:'Словник перекладів і DOM-інжектор формують пакет локалізації. Автономний інсталятор створює резервну копію та дає змогу відновити оригінал.',decision:'TreeWalker і MutationObserver обробляють інтерфейс. Ділянки коду та термінали виключені з автоперекладу.',top:[['Словник','uk_translations.json'],['DOM-інжектор','JavaScript']],core:['Пакет локалізації','app_uk.asar'],bottom:[['Інсталятор','C# / WinForms'],['Резервна копія','app.asar.bak'],['Український UI','Antigravity 2.0']],transport:'підготовка ASAR',output:'встановлення з відновленням',caption:'Схема узагальнює склад і процес доставки локалізації. Словник містить понад 1 670 ключів за даними README.',links:[['Репозиторій','antigravity-ua'],['Повна схема','antigravity-ua/blob/main/docs/architecture.json']]},
umod:{name:'UMOD · від налаштування до запуску',type:'RUST / PYTHON / SHELL',problem:'Підключення Codex потребує конфігурації, вибору моделі й чинного токена. Ручне повторення цих кроків ускладнює щоденну роботу.',solution:'Installer готує конфігурацію та скрипти. GUI запускає проксі й Codex CLI. Локальний проксі підставляє Entra-токен та оновлює його до завершення строку дії.',decision:'Проксі слухає лише loopback. Credential-файл видається окремо; його вміст GUI не показує.',top:[['Installer','конфігурація'],['Rust GUI','запуск Codex CLI']],core:['umod-token-proxy','127.0.0.1:8787'],bottom:[['Microsoft Entra','отримання токена'],['UMOD inference','запити Codex']],transport:'Codex CLI → локальний проксі',output:'автентифікація та запити',caption:'Узагальнена схема двох пов’язаних репозиторіїв. Проксі оновлює токен за 5 хвилин до завершення строку дії.',links:[['GUI на GitHub','umod-codex-gui'],['Installer на GitHub','umod-installer']]}
};

const panel=document.getElementById('case-panel');
const tabs=[...document.querySelectorAll('[role="tab"]')];
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const node=([title,sub],core=false)=>`<div class="node${core?' node-core':''}">${title}<small>${sub}</small></div>`;

function selectProject(id,focus=false){
  const c=cases[id]; if(!c) return;
  tabs.forEach(t=>{
    const active=t.dataset.project===id;
    t.setAttribute('aria-selected',String(active));
    t.tabIndex=active?0:-1;
    if(active&&focus) t.focus();
  });
  panel.setAttribute('aria-labelledby','tab-'+id);
  panel.innerHTML=`<article class="case"><div class="case-text"><span class="case-label">${c.type}</span><h3>${c.name}</h3><h4>ЗАДАЧА</h4><p>${c.problem}</p><h4>РІШЕННЯ</h4><p>${c.solution}</p><h4>ТЕХНІЧНИЙ АКЦЕНТ</h4><p>${c.decision}</p><div class="case-links">${c.links.map(([label,path])=>`<a href="https://github.com/RiasJ1Dar/${path}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join('')}</div></div><figure class="diagram" style="margin:0" aria-label="Схема архітектури ${c.name}"><div class="diagram-head"><span>АРХІТЕКТУРА</span><span>СПРОЩЕНА СХЕМА</span></div><div class="flow"><div class="flow-top">${c.top.map(n=>node(n)).join('')}</div><div class="flow-arrow"><span aria-hidden="true">↓</span>${c.transport}</div>${node(c.core,true)}<div class="flow-arrow"><span aria-hidden="true">↓</span>${c.output}</div><div class="flow-bottom">${c.bottom.map(n=>node(n)).join('')}</div></div><figcaption class="diagram-caption">${c.caption}</figcaption></figure></article>`;
}

tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>selectProject(tab.dataset.project));
  tab.addEventListener('keydown',e=>{
    let next;
    if(e.key==='ArrowRight') next=(i+1)%tabs.length;
    else if(e.key==='ArrowLeft') next=(i+tabs.length-1)%tabs.length;
    else if(e.key==='Home') next=0;
    else if(e.key==='End') next=tabs.length-1;
    else return;
    e.preventDefault();
    selectProject(tabs[next].dataset.project,true);
  });
});
document.querySelectorAll('[data-select]').forEach(link=>link.addEventListener('click',()=>selectProject(link.dataset.select)));
selectProject('exchange');

/* scroll progress */
const bar=document.querySelector('.scroll-progress');
function onScroll(){
  if(!bar) return;
  const h=document.documentElement;
  const max=h.scrollHeight-h.clientHeight;
  bar.style.width=(max>0?(h.scrollTop/max)*100:0)+'%';
}
window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

/* reveal on scroll */
if(!reduce){
  const cards=[...document.querySelectorAll('.reveal-card')];
  cards.forEach((el,i)=>el.style.setProperty('--i',i%6));
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:.12, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal,.reveal-card').forEach(el=>io.observe(el));
} else {
  document.querySelectorAll('.reveal,.reveal-card').forEach(el=>el.classList.add('in'));
}

/* custom cursor */
const cur=document.querySelector('.cursor');
const dot=document.querySelector('.cursor-dot');
let mx=0,my=0,cx=0,cy=0;
if(cur&&dot&&!reduce&&matchMedia('(pointer:fine)').matches){
  window.addEventListener('mousemove',e=>{
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
  },{passive:true});
  (function loop(){
    cx+=(mx-cx)*.18; cy+=(my-cy)*.18;
    cur.style.left=cx+'px'; cur.style.top=cy+'px';
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a,button').forEach(el=>{
    el.addEventListener('mouseenter',()=>cur.classList.add('on-link'));
    el.addEventListener('mouseleave',()=>cur.classList.remove('on-link'));
  });
}

/* card tilt */
if(!reduce&&matchMedia('(pointer:fine)').matches){
  document.querySelectorAll('.repo-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(900px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave',()=>{ card.style.transform=''; });
  });
}

/* magnetic buttons */
if(!reduce&&matchMedia('(pointer:fine)').matches){
  document.querySelectorAll('.magnetic').forEach(btn=>{
    btn.addEventListener('mousemove',e=>{
      const r=btn.getBoundingClientRect();
      const x=e.clientX-(r.left+r.width/2);
      const y=e.clientY-(r.top+r.height/2);
      btn.style.transform=`translate(${x*.2}px,${y*.2}px)`;
    });
    btn.addEventListener('mouseleave',()=>{ btn.style.transform=''; });
  });
}

/* canvas particles / constellation */
(function(){
  const canvas=document.getElementById('bg-canvas');
  if(!canvas||reduce) return;
  const ctx=canvas.getContext('2d');
  let w,h,pts,raf,mxp=.5,myp=.5;
  function resize(){
    w=canvas.width=innerWidth; h=canvas.height=innerHeight;
    const n=Math.min(70, Math.floor((w*h)/18000));
    pts=Array.from({length:n},()=>({
      x:Math.random()*w,y:Math.random()*h,
      vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35,
      r:Math.random()*1.8+.4
    }));
  }
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('mousemove',e=>{mxp=e.clientX/w; myp=e.clientY/h;},{passive:true});
  resize();
  const colors=['rgba(232,121,249,','rgba(167,139,250,','rgba(129,140,248,','rgba(34,211,238,'];
  function frame(){
    ctx.clearRect(0,0,w,h);
    // soft iridescent orbs following mouse
    const g=ctx.createRadialGradient(mxp*w,myp*h,0,mxp*w,myp*h,280);
    g.addColorStop(0,'rgba(232,121,249,.12)');
    g.addColorStop(.45,'rgba(129,140,248,.06)');
    g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);

    for(const p of pts){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
    }
    for(let i=0;i<pts.length;i++){
      for(let j=i+1;j<pts.length;j++){
        const a=pts[i],b=pts[j];
        const dx=a.x-b.x, dy=a.y-b.y, d=Math.hypot(dx,dy);
        if(d<140){
          ctx.strokeStyle=`rgba(180,120,255,${(1-d/140)*.22})`;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    pts.forEach((p,i)=>{
      const col=colors[i%colors.length];
      ctx.fillStyle=col+'.75)';
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    raf=requestAnimationFrame(frame);
  }
  frame();
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) cancelAnimationFrame(raf); else frame();
  });
})();
