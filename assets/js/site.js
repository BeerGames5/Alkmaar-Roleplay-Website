(() => {
  const ic = window.PanelIcon;
  const wait = window.panelWait;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  $$('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', ic(el.dataset.icon)));
  $$('[data-icon-only]').forEach((el) => { el.innerHTML = ic(el.dataset.iconOnly); });
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  const nav = $('#nav');
  const bar = $('.progress');
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 20);
    if (bar) bar.style.setProperty('--p', Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('#menuBtn');
  const menu = $('#mobileMenu');
  if (menuBtn && menu) {
    const set = (on) => { menu.classList.toggle('on', on); menuBtn.setAttribute('aria-expanded', on); menuBtn.innerHTML = ic(on ? 'x' : 'menu'); };
    menuBtn.addEventListener('click', () => set(!menu.classList.contains('on')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => set(false)));
  }

  $$('.split').forEach((h) => {
    const walk = (node, idx) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--wi', idx.v++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n, idx);
      });
    };
    walk(h, { v: 0 });
    h.classList.add('split-words');
  });

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('[data-reveal]').forEach((el) => revealIO.observe(el));

  const runWhenVisible = (el, mock) => {
    if (!el || !mock) return;
    new IntersectionObserver(([e]) => { if (e.isIntersecting) mock.start(); else mock.stop(); }, { threshold: 0.05 }).observe(el);
  };

  const marquee = $('#marquee');
  if (marquee) {
    const items = [['tv', 'GameView'], ['map', 'Live 3D map'], ['ticket', 'Tickets'], ['user-x', 'Bans'], ['wallet', 'Economy'], ['scroll-text', 'Staff logs'], ['messages-square', 'Staff chat'], ['headphones', 'Voice'], ['square-terminal', 'Dev tools'], ['car', 'Vehicles'], ['package', 'Items'], ['shield-alert', 'Anticheat'], ['palette', 'Themes'], ['languages', '5 languages']];
    const html = items.map(([i, t]) => `<span>${ic(i)}${t}</span>`).join('');
    marquee.innerHTML = html + html;
  }

  const heroEl = $('#heroPanel');
  let hero;
  if (heroEl && window.PanelMock) {
    hero = new window.PanelMock(heroEl, { mode: 'demo', interactive: false });
    runWhenVisible(heroEl, hero);
    const toasts = [['gavel', 'Rico Martens banned · 7 days', 'bad'], ['heart-pulse', 'Lotte Janssen revived', 'ok'], ['ticket', 'New ticket #305 · Bug', 'info'], ['navigation', 'Teleported to Sem de Boer', 'info']];
    let ti = 0;
    setInterval(() => { if (hero.running && !document.hidden) { const t = toasts[ti++ % toasts.length]; hero.toast(t[0], t[1], t[2]); } }, 7000);
    const stage = $('#heroStage');
    const tilt = $('#heroTilt');
    if (stage && tilt && !reduce && matchMedia('(pointer:fine)').matches) {
      let raf;
      document.querySelector('.hero').addEventListener('pointermove', (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = stage.getBoundingClientRect();
          const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
          const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
          tilt.style.transform = `rotateY(${-14 + x * 16}deg) rotateX(${8 - y * 10}deg) rotateZ(1deg)`;
        });
      });
      document.querySelector('.hero').addEventListener('pointerleave', () => { tilt.style.transform = ''; });
    }
    if (!reduce) {
      addEventListener('scroll', () => {
        const y = scrollY;
        if (y < innerHeight * 1.2 && stage) stage.style.transform = `translateY(${y * 0.12}px)`;
      }, { passive: true });
    }
  }

  const storyEl = $('#storyPanel');
  if (storyEl && window.PanelMock) {
    const story = new window.PanelMock(storyEl, { mode: 'story', interactive: false });
    runWhenVisible(storyEl, story);
    let token = 0;
    let current = -1;
    const bars = $$('.story-bar i');
    const steps = [
      async () => {
        story.closeDialog(); story.closeProfile(); story.resetPlayers(); story.go('dashboard');
        await wait(700);
        story.toast('triangle-alert', 'Anticheat · Rico Martens killed 6 players in 40s', 'bad');
      },
      async (t) => {
        story.closeDialog(); story.closeProfile(); story.resetPlayers(); story.go('players');
        await wait(500);
        if (t !== token) return;
        await story.typeInto('.pm-search input', 'rico', 110);
      },
      async () => {
        story.closeDialog(); story.resetPlayers(); story.go('players');
        const s = story.$('.pm-search input'); s.value = 'rico'; story.filter('rico');
        await wait(250);
        story.openProfile(4);
      },
      async (t) => {
        story.go('players');
        if (!story.$('.pm-profile.on')) story.openProfile(4);
        await wait(500);
        if (t !== token) return;
        story.openBan();
        await wait(900);
        if (t !== token) return;
        story.pickDuration('7d');
        await wait(900);
        if (t !== token) return;
        story.confirmBan();
      },
    ];
    const setStep = (i) => {
      if (i === current) return;
      current = i;
      const t = ++token;
      $$('.step').forEach((s) => s.classList.toggle('on', Number(s.dataset.step) === i));
      bars.forEach((b, n) => b.classList.toggle('on', n <= i));
      steps[i](t);
    };
    const stepIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setStep(Number(e.target.dataset.step)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    $$('.step').forEach((s) => stepIO.observe(s));
    $('.step').classList.add('on');
    bars[0].classList.add('on');
  }

  const demoEl = $('#demoPanel');
  if (demoEl && window.PanelMock) {
    const demo = new window.PanelMock(demoEl, { mode: 'demo', interactive: true });
    const caption = $('#demoCaption');
    const chapBox = $('#demoChapters');
    let paused = false;
    let token = 0;
    let idx = 0;
    let visible = false;
    let idleTimer;
    const say = (t) => { caption.innerHTML = `<span>${t}</span>`; };
    const chapters = [
      { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard', cap: 'Your whole server, at a glance', dur: 6500, run: async () => { demo.go('dashboard'); await wait(1200); await demo.cursorTo('.pm-qa .pm-chip:nth-child(4)'); demo.toast('heart-pulse', 'Everyone revived', 'ok'); await wait(1500); } },
      { id: 'players', icon: 'users', label: 'Players', cap: 'Find any player in seconds', dur: 8000, run: async (t) => { demo.resetPlayers(); await demo.cursorTo('.pm-nav[data-go="players"]'); demo.go('players'); await wait(700); await demo.cursorTo('.pm-search', true); if (t !== token) return; await demo.typeInto('.pm-search input', 'rico', 120); await wait(500); await demo.cursorTo('[data-open="4"]'); demo.openProfile(4); await wait(2200); } },
      { id: 'ban', icon: 'gavel', label: 'Ban', cap: 'Ban them in two clicks', dur: 6500, run: async (t) => { if (demo.view !== 'players') demo.go('players'); if (!demo.$('.pm-profile.on')) demo.openProfile(4); await wait(600); await demo.cursorTo('[data-act="ban"]'); if (t !== token) return; demo.openBan(); await wait(700); await demo.cursorTo('[data-dur="7d"]'); demo.pickDuration('7d'); await wait(400); await demo.cursorTo('[data-act="confirm-ban"]'); if (t !== token) return; demo.confirmBan(); await wait(1600); } },
      { id: 'tickets', icon: 'ticket', label: 'Tickets', cap: 'Every report, handled', dur: 6000, run: async () => { demo.resetTicket(); await demo.cursorTo('.pm-nav[data-go="tickets"]'); demo.go('tickets'); await wait(900); await demo.cursorTo('[data-ticket="302"]'); await demo.moveTicket(); demo.toast('ticket', 'Ticket #302 claimed', 'info'); await wait(1600); } },
      { id: 'map', icon: 'map', label: 'Live map', cap: 'See your whole city, live', dur: 6500, run: async () => { await demo.cursorTo('.pm-nav[data-go="map"]'); demo.go('map'); demo.hideCursor(); await wait(4800); } },
      { id: 'gameview', icon: 'tv', label: 'GameView', cap: 'Watch any screen, live', dur: 6000, run: async () => { await demo.cursorTo('.pm-nav[data-go="gameview"]'); demo.go('gameview'); demo.hideCursor(); await wait(4500); } },
      { id: 'economy', icon: 'wallet', label: 'Economy', cap: 'Every euro in your city', dur: 6000, run: async () => { await demo.cursorTo('.pm-nav[data-go="economy"]'); demo.go('economy'); demo.hideCursor(); await wait(4500); } },
      { id: 'devtools', icon: 'square-terminal', label: 'Dev tools', cap: 'Run code without leaving the panel', dur: 7500, run: async (t) => { await demo.cursorTo('.pm-nav[data-go="devtools"]'); demo.go('devtools'); demo.$('[data-k="out"]').innerHTML = '<span class="mute">Nothing run yet</span>'; demo.hideCursor(); await wait(500); if (t !== token) return; await demo.typeCode(); await demo.cursorTo('[data-act="run"]'); demo.runCode(); await wait(1800); } },
      { id: 'settings', icon: 'palette', label: 'Themes', cap: 'Make it yours', dur: 8000, run: async (t) => { await demo.cursorTo('.pm-nav[data-go="settings"]'); demo.go('settings'); await wait(700); for (const th of ['blue', 'red', 'light', 'black']) { if (t !== token) return; await demo.cursorTo(`[data-theme-set="${th}"]`); demo.setTheme(th); await wait(900); } await demo.cursorTo('[data-accent="#8b5cf6"]'); demo.setAccent('#8b5cf6'); await wait(900); await demo.cursorTo('[data-accent="#2f7fe0"]'); demo.setAccent('#2f7fe0'); await wait(600); } },
    ];
    chapBox.innerHTML = chapters.map((c, i) => `<button class="chap" data-chap="${i}">${ic(c.icon)}${c.label}</button>`).join('') + `<button class="chap tour-btn" id="tourBtn">${ic('pause')}<span>Pause tour</span></button>`;
    const tourBtn = $('#tourBtn');
    const markChap = (i, dur) => {
      $$('.chap[data-chap]').forEach((b) => { b.classList.remove('on'); b.style.removeProperty('--dur'); });
      const b = $(`.chap[data-chap="${i}"]`);
      if (b) { void b.offsetWidth; b.style.setProperty('--dur', `${dur}ms`); b.classList.add('on'); }
    };
    const setPaused = (p) => {
      paused = p;
      document.getElementById('demo').classList.toggle('demo-paused', p);
      tourBtn.innerHTML = `${ic(p ? 'play' : 'pause')}<span>${p ? 'Resume tour' : 'Pause tour'}</span>`;
      if (p) { token++; demo.hideCursor(); }
    };
    const loop = async () => {
      while (visible && !paused) {
        const t = ++token;
        const c = chapters[idx];
        say(c.cap);
        markChap(idx, c.dur);
        const started = Date.now();
        try { await c.run(t); } catch {}
        if (t !== token) return;
        const rest = c.dur - (Date.now() - started);
        if (rest > 0) await wait(rest);
        if (t !== token) return;
        idx = (idx + 1) % chapters.length;
        if (idx === 0) { demo.resetPlayers(); demo.resetTicket(); }
      }
    };
    const resume = () => { setPaused(false); demo.closeDialog(); loop(); };
    chapBox.addEventListener('click', (e) => {
      const b = e.target.closest('.chap');
      if (!b) return;
      if (b.id === 'tourBtn') { if (paused) resume(); else setPaused(true); return; }
      idx = Number(b.dataset.chap);
      demo.closeDialog();
      if (chapters[idx].id !== 'ban') demo.closeProfile();
      if (paused) { setPaused(false); }
      token++;
      loop();
    });
    demo.on((type, v) => {
      if (type === 'user') {
        if (!paused) setPaused(true);
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { if (paused && visible) resume(); }, 25000);
      }
      if (type === 'view' && paused) {
        const i = chapters.findIndex((c) => c.id === v);
        if (i >= 0) { $$('.chap[data-chap]').forEach((b) => b.classList.toggle('on', Number(b.dataset.chap) === i)); say(chapters[i].cap); }
      }
    });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { demo.start(); if (!paused) loop(); } else { demo.stop(); token++; demo.hideCursor(); }
    }, { threshold: 0.25 }).observe(demoEl);
  }

  const mini = $('#miniCode');
  if (mini) {
    const lines = [
      ['<span class="mute">-- server · Ctrl+Enter</span>', 0],
      ['<span class="kw">for</span> _, id <span class="kw">in</span> <span class="fn">ipairs</span>(<span class="fn">GetPlayers</span>()) <span class="kw">do</span>', 1],
      ['  <span class="fn">print</span>(id, <span class="fn">GetPlayerName</span>(id))', 1],
      ['<span class="kw">end</span>', 1],
      ['', 0],
      ['<span class="ok">› 4   Rico Martens</span>', 2],
      ['<span class="ok">› 7   Lotte Janssen</span>', 2],
      ['<span class="ok">› 11  Sem de Boer</span>', 2],
    ];
    let started = false;
    new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      while (true) {
        mini.innerHTML = '';
        for (const [l, kind] of lines) {
          if (kind === 1 && !reduce) {
            const tmp = document.createElement('div');
            tmp.innerHTML = l;
            const plain = tmp.textContent;
            for (let i = 1; i <= plain.length; i += 2) {
              mini.innerHTML = mini.dataset.done ? `${mini.dataset.done}${plain.slice(0, i)}<i class="caret"></i>` : `${plain.slice(0, i)}<i class="caret"></i>`;
              await wait(28);
            }
          }
          mini.dataset.done = (mini.dataset.done || '') + l + '\n';
          mini.innerHTML = `${mini.dataset.done}<i class="caret"></i>`;
          await wait(kind === 2 ? 260 : 120);
        }
        await wait(4200);
        mini.dataset.done = '';
      }
    }, { threshold: 0.4 }).observe(mini);
  }

  const term = $('#term');
  if (term) {
    const L = [
      ['c1', '> ensure arp-adminpanel', 500],
      ['', '[  script:arp-adminpanel] Starting Alkmaar Admin Panel v4.3.3', 350],
      ['c3', '[  script:arp-adminpanel] Framework detected: QBCore', 300],
      ['c3', '[  script:arp-adminpanel] Database ready (oxmysql)', 300],
      ['c2', '[  script:arp-adminpanel] Licence valid ✓', 400],
      ['c2', '[  script:arp-adminpanel] Connected to Admin Panel Cloud ✓', 700],
      ['c1', '> panellink', 600],
      ['c4', '[  script:arp-adminpanel] Your private panel:', 200],
      ['c5', '[  script:arp-adminpanel] https://your-panel.cloud/s/7f3a9c2e1b…/', 300],
      ['', '[  script:arp-adminpanel] Make a browser login with /createlogin', 0],
    ];
    const steps = $$('#howSteps .how-step');
    let started = false;
    new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      while (true) {
        let out = '';
        term.innerHTML = '<span class="cursor"></span>';
        for (let i = 0; i < L.length; i++) {
          const [c, text, d] = L[i];
          steps.forEach((s, n) => s.classList.toggle('on', n === (i < 1 ? 1 : i < 6 ? 1 : 2)));
          if (text.startsWith('>') && !reduce) {
            for (let k = 1; k <= text.length; k++) { term.innerHTML = `${out}<span class="${c}">${text.slice(0, k)}</span><span class="cursor"></span>`; await wait(45); }
          }
          out += `<span class="${c}">${text}</span>\n`;
          term.innerHTML = `${out}<span class="cursor"></span>`;
          await wait(d);
        }
        steps.forEach((s) => s.classList.remove('on'));
        steps[0].classList.add('on');
        await wait(5000);
      }
    }, { threshold: 0.35 }).observe(term);
  }

  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const end = Number(e.target.dataset.count);
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 1100);
        e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  $$('.tile').forEach((t) => t.addEventListener('pointermove', (e) => {
    const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', `${e.clientX - r.left}px`);
    t.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  const vWrap = $('#videoWrap');
  const video = $('#showVideo');
  const cover = $('#videoCover');
  if (vWrap && video && cover) {
    cover.addEventListener('click', () => {
      video.controls = true;
      vWrap.classList.add('playing');
      video.play().catch(() => {});
    });
    video.addEventListener('ended', () => { vWrap.classList.remove('playing'); video.controls = false; video.currentTime = 0; });
  }

  const gallery = $('#gallery');
  if (gallery) {
    const shots = [
      ['dashboard', 'layout-dashboard', 'Dashboard'], ['player-profile', 'user-cog', 'Player file'], ['map-satellite', 'map', 'Satellite map'], ['map-3d', 'map', '3D map'],
      ['gameview', 'tv', 'GameView'], ['tickets', 'ticket', 'Tickets'], ['economy', 'wallet', 'Economy'], ['items', 'package', 'Items'],
      ['vehicles', 'car', 'Vehicles'], ['devtools', 'square-terminal', 'Dev tools'], ['staff-chat', 'messages-square', 'Staff chat'], ['settings', 'palette', 'Settings'],
    ];
    gallery.innerHTML = shots.map(([f, i, l]) => `<button class="shot" data-src="assets/shots/${f}.webp" aria-label="Open ${l} screenshot"><img src="assets/shots/${f}.webp" alt="${l}" loading="lazy" decoding="async" width="1600" height="900"><figcaption>${ic(i)}${l}</figcaption></button>`).join('');
    const lb = $('#lightbox');
    const lbImg = $('#lbImg');
    let down = null;
    let moved = 0;
    gallery.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, s: gallery.scrollLeft }; moved = 0; gallery.classList.add('drag'); });
    addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - down.x; moved = Math.max(moved, Math.abs(dx)); gallery.scrollLeft = down.s - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = null; gallery.classList.remove('drag'); });
    gallery.addEventListener('click', (e) => {
      const s = e.target.closest('.shot');
      if (!s || moved > 6) return;
      lbImg.src = s.dataset.src;
      lbImg.alt = s.querySelector('img').alt;
      if (lb.showModal) lb.showModal();
    });
    $('#lbClose').addEventListener('click', () => lb.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    const by = (d) => gallery.scrollBy({ left: d * Math.min(800, innerWidth * 0.8), behavior: 'smooth' });
    $('#galPrev').addEventListener('click', () => by(-1));
    $('#galNext').addEventListener('click', () => by(1));
  }

  $$('.faq details').forEach((d) => {
    const s = d.querySelector('summary');
    const a = d.querySelector('.ans');
    s.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      if (d.open) {
        const h = a.scrollHeight;
        a.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        const h = a.scrollHeight;
        a.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  });
})();
