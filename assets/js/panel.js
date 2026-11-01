(() => {
  const ic = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(window.ICONS || {})[n] || ''}</svg>`;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const pad = (n) => String(n).padStart(2, '0');
  const clock = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PLAYERS = [
    { id: 4, name: 'Rico Martens', job: 'Mechanic', grade: 'Lead', group: 'user', ping: 27, ini: 'RM', hp: 100, ar: 40, hu: 72, th: 64, cash: 4718, bank: 118450, time: '4d', sessions: 96, warns: 2, bans: 0 },
    { id: 7, name: 'Lotte Janssen', job: 'Ambulance', grade: 'Doctor', group: 'user', ping: 41, ini: 'LJ', hp: 88, ar: 0, hu: 54, th: 80, cash: 1200, bank: 54200, time: '2d', sessions: 51, warns: 0, bans: 0 },
    { id: 11, name: 'Sem de Boer', job: 'Politie', grade: 'Inspecteur', group: 'admin', ping: 33, ini: 'SB', hp: 100, ar: 100, hu: 91, th: 77, cash: 860, bank: 233000, time: '9d', sessions: 214, warns: 0, bans: 0 },
    { id: 15, name: 'Fenna Bakker', job: 'Taxi', grade: 'Driver', group: 'user', ping: 58, ini: 'FB', hp: 76, ar: 0, hu: 40, th: 35, cash: 310, bank: 8400, time: '18h', sessions: 12, warns: 1, bans: 0 },
    { id: 19, name: 'Daan Visser', job: 'Politie', grade: 'Agent', group: 'moderator', ping: 22, ini: 'DV', hp: 100, ar: 60, hu: 66, th: 70, cash: 2400, bank: 61000, time: '5d', sessions: 133, warns: 0, bans: 0 },
    { id: 23, name: 'Julia Meijer', job: 'Wegenwacht', grade: 'Monteur', group: 'user', ping: 36, ini: 'JM', hp: 100, ar: 0, hu: 83, th: 59, cash: 5100, bank: 39000, time: '3d', sessions: 70, warns: 0, bans: 0 },
    { id: 26, name: 'Milan de Vries', job: 'Unemployed', grade: '', group: 'user', ping: 64, ini: 'MV', hp: 42, ar: 0, hu: 22, th: 18, cash: 90, bank: 1200, time: '6h', sessions: 4, warns: 0, bans: 0 },
    { id: 31, name: 'Tess Mulder', job: 'Ambulance', grade: 'Paramedic', group: 'user', ping: 29, ini: 'TM', hp: 100, ar: 0, hu: 70, th: 66, cash: 1800, bank: 47000, time: '1d', sessions: 30, warns: 0, bans: 0 },
    { id: 34, name: 'Bram Willems', job: 'Mechanic', grade: 'Trainee', group: 'user', ping: 47, ini: 'BW', hp: 100, ar: 20, hu: 61, th: 52, cash: 640, bank: 15800, time: '20h', sessions: 16, warns: 0, bans: 0 },
    { id: 38, name: 'Sophie Peters', job: 'Politie', grade: 'Brigadier', group: 'user', ping: 31, ini: 'SP', hp: 100, ar: 80, hu: 75, th: 71, cash: 1300, bank: 88000, time: '6d', sessions: 160, warns: 0, bans: 0 },
  ];
  const GROUP = { admin: ['Admin', 'info'], moderator: ['Moderator', 'violet'], user: ['', ''] };
  const FEED = [
    ['log-in', 'ok', '{p} joined the server'],
    ['user', '', '{p} picked a character ({j})'],
    ['briefcase', '', '{p} went on duty ({j})'],
    ['skull', 'bad', '{p} died near Legion Square'],
    ['car', '', '{p} took a vehicle out of the garage'],
    ['log-out', 'mute', '{p} left the server (3m)'],
    ['banknote', 'warn', '{p} received €2,500 from a job'],
  ];
  const STAFF_LOG = [
    ['heart-pulse', 'ok', 'Sem de Boer revived Lotte Janssen'],
    ['navigation', 'info', 'Daan Visser teleported to Rico Martens'],
    ['snowflake', 'info', 'Sem de Boer froze Milan de Vries'],
    ['triangle-alert', 'warn', 'Daan Visser warned Milan de Vries — Fail RP'],
    ['banknote', 'warn', 'Sem de Boer gave €5,000 to Julia Meijer'],
    ['shirt', '', 'Daan Visser opened the clothing menu for Tess Mulder'],
    ['ticket', 'info', 'Sem de Boer claimed ticket #302'],
    ['package', '', 'Daan Visser gave 2× Bandage to Bram Willems'],
    ['ban', 'bad', 'Sem de Boer banned Rico Martens — 7 days'],
  ];
  const NAV = [
    ['Overview', [['dashboard', 'layout-dashboard', 'Dashboard'], ['logs', 'activity', 'Activity'], ['economy', 'wallet', 'Economy']]],
    ['Community', [['players', 'users', 'Players'], ['tickets', 'ticket', 'Tickets', 1], ['bans', 'user-x', 'Bans'], ['x-anticheat', 'shield', 'Anticheat']]],
    ['World', [['map', 'map', 'Map'], ['x-vehicles', 'car', 'Vehicles'], ['x-items', 'package', 'Items'], ['gameview', 'tv', 'GameView']]],
    ['Team', [['x-staff', 'shield-check', 'Staff'], ['x-refunds', 'receipt', 'Refunds'], ['devtools', 'square-terminal', 'Dev tools']]],
    ['Panel', [['x-chat', 'messages-square', 'Staff chat'], ['settings', 'settings', 'Settings']]],
  ];
  const THEMES = ['black', 'blue', 'red', 'light'];
  const ACCENTS = ['#2f7fe0', '#5b8def', '#8b5cf6', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#d4d4d8'];

  function series(n, base, amp) {
    const out = [];
    let v = base;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const wave = Math.sin(t * Math.PI * 2 - 1.2) * amp + Math.sin(t * 13) * amp * 0.12;
      v = Math.max(2, base + wave + rnd(-amp * 0.08, amp * 0.08));
      out.push(v);
    }
    return out;
  }

  function pathFrom(vals, w, h, max, smooth = true) {
    const step = w / (vals.length - 1);
    const pts = vals.map((v, i) => [i * step, h - (v / max) * h]);
    if (!smooth) return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
    let d = `M${pts[0][0]},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      d += `C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }
    return d;
  }

  class PanelMock {
    constructor(host, opts = {}) {
      this.host = host;
      this.opts = Object.assign({ mode: 'demo', interactive: true, start: 'dashboard' }, opts);
      this.view = null;
      this.timers = [];
      this.running = false;
      this.online = 38;
      this.uptime = 23 * 60 + 26;
      this.chartVals = series(48, 30, 14);
      this.ecoVals = series(40, 46, 4);
      this.listeners = [];
      this.build();
      this.go(this.opts.start, true);
      this.fit();
      if ('ResizeObserver' in window) new ResizeObserver(() => this.fit()).observe(host);
      else window.addEventListener('resize', () => this.fit());
    }

    on(fn) { this.listeners.push(fn); }
    emit(type, data) { this.listeners.forEach((f) => f(type, data)); }

    fit() {
      const w = this.host.clientWidth;
      if (!w) return;
      const s = w / 1280;
      this.root.style.transform = `scale(${s})`;
      this.host.style.height = `${760 * s}px`;
      this.scale = s;
    }

    build() {
      const p = this.opts;
      const nav = NAV.map(([g, items]) => `<div class="pm-ng">${p.mode === 'demo' ? `<span class="pm-ngl">${g}</span>` : ''}${items.map(([id, icon, label, badge]) => `<button class="pm-nav" data-go="${id}" title="${label}">${ic(icon)}<span>${label}</span>${badge ? `<b class="pm-badge">${badge}</b>` : ''}</button>`).join('')}</div>`).join('');
      this.host.innerHTML = `
<div class="pm" data-theme="black" data-mode="${p.mode}">
  <aside class="pm-side ${p.mode === 'demo' ? 'open' : ''}">
    <div class="pm-brand"><img src="assets/img/logo.webp" alt="" width="28" height="28"><div><strong>Alkmaar</strong><small>ADMIN PANEL</small></div></div>
    ${p.mode === 'demo' ? '<span class="pm-role"><i></i>EIGENAAR</span>' : ''}
    <nav class="pm-navs">${nav}</nav>
  </aside>
  <main class="pm-main">${this.views()}</main>
  <footer class="pm-status">
    <span><i class="dot ok"></i><b data-k="online">38</b>/64 players</span>
    <span>${ic('shield')}<b>4</b> staff online</span>
    <span>${ic('ticket')}<b data-k="tickets">3</b> open tickets</span>
    <span>${ic('timer')}Uptime <b data-k="uptime">23h 26m</b></span>
    <span class="r"><span data-k="clock">${clock()}</span> BeerGames5 <em>EIGENAAR</em></span>
  </footer>
  <div class="pm-veil"></div>
  <section class="pm-profile" aria-hidden="true"></section>
  <section class="pm-dialog" aria-hidden="true"></section>
  <div class="pm-toasts"></div>
  <div class="pm-cursor">${ic('mouse-pointer')}</div>
</div>`;
      this.root = this.host.querySelector('.pm');
      this.cursor = this.root.querySelector('.pm-cursor');
      this.renderPlayers();
      this.renderTickets();
      this.renderBans();
      this.renderLogs();
      this.renderEconomy();
      this.renderMapDots();
      this.renderSettings();
      this.root.addEventListener('click', (e) => this.onClick(e));
      const search = this.root.querySelector('.pm-search input');
      if (search) search.addEventListener('input', () => this.filter(search.value));
    }

    views() {
      const chartW = 640, chartH = 150;
      return `
<div class="pm-view" data-view="dashboard">
  <header class="pm-h"><div><h3>Welcome back, BeerGames5</h3><p>Here is how the city is doing.</p></div></header>
  <div class="pm-hero card">
    <div class="pm-now">
      <span class="pm-live"><i class="dot ok pulse"></i>Alkmaar right now</span>
      <div class="pm-big"><b data-k="online">38</b><small>/ 64</small></div>
      <span class="pm-sub" data-k="fill">59% of the city is filled</span>
      <div class="pm-seg">${Array.from({ length: 64 }, (_, i) => `<i style="--d:${i * 12}ms"></i>`).join('')}</div>
      <div class="pm-legend"><span><i class="dot ok"></i>Normal <b>34</b></span><span><i class="dot bad"></i>Dead <b>2</b></span><span><i class="dot warn"></i>Cuffed <b>2</b></span><span><i class="dot info"></i>On duty <b>17</b></span></div>
    </div>
    <div class="pm-chart">
      <div class="pm-chart-h"><b>Players online</b><span>Peak 52</span><div class="pm-tabs sm"><button class="on">24h</button><button>7d</button></div></div>
      <svg viewBox="0 0 ${chartW} ${chartH}" preserveAspectRatio="none" class="pm-svg">
        <defs><linearGradient id="g-${this.uid = Math.random().toString(36).slice(2, 7)}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
        ${[0, 1, 2, 3].map((i) => `<line x1="0" x2="${chartW}" y1="${i * 50}" y2="${i * 50}" class="grid"/>`).join('')}
        <path class="area" fill="url(#g-${this.uid})"/><path class="line"/><circle class="tip" r="4"/>
      </svg>
      <div class="pm-axis"><span>21:00</span><span>00:00</span><span>03:00</span><span>06:00</span><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div>
    </div>
  </div>
  <div class="pm-stats">
    <div class="card"><span>Total players</span><b>3,120</b><small>9,422 characters</small></div>
    <div class="card"><span>Staff online</span><b>4</b><small>3 on duty</small></div>
    <div class="card"><span>Open tickets</span><b data-k="tickets">3</b><small>1 being handled</small></div>
    <div class="card"><span>Bans today</span><b data-k="bancount">1</b><small>4 kicks, 7 warns</small></div>
    <div class="card"><span>Economy</span><b>€54.1M</b><small>€3.9M cash, €50.2M bank</small></div>
    <div class="card"><span>Uptime</span><b data-k="uptime">23h 26m</b><small>509 resources</small></div>
  </div>
  <div class="pm-row3">
    <div class="card pm-qa"><h4>Quick actions</h4><div class="pm-chips">${[['ghost', 'Noclip'], ['shield', 'Godmode'], ['eye-off', 'Invisible'], ['heart-pulse', 'Revive everyone'], ['megaphone', 'Announcement'], ['ticket', 'Tickets'], ['map', 'Live map'], ['user-x', 'Bans'], ['scroll-text', 'Logs']].map(([i, t]) => `<button class="pm-chip">${ic(i)}${t}</button>`).join('')}</div></div>
    <div class="card pm-jobs"><h4>Jobs <small>on duty / online</small></h4>${[['shield', 'Politie', 9, 11], ['heart-pulse', 'Ambulance', 4, 6], ['wrench', 'Wegenwacht', 3, 5], ['car-taxi-front', 'Taxi', 1, 4]].map(([i, n, a, b]) => `<div class="pm-job">${ic(i)}<div><div class="pm-job-t"><span>${n}</span><b>${a}<small> / ${b}</small></b></div><div class="pm-bar"><i style="--w:${(a / b) * 100}%"></i></div></div></div>`).join('')}</div>
    <div class="card pm-feed"><h4>Activity <span class="pm-tabs sm"><button class="on">All</button><button>Joins</button><button>Deaths</button></span></h4><ul data-k="feed"></ul></div>
  </div>
</div>

<div class="pm-view" data-view="players">
  <header class="pm-h"><div><h3>Players</h3><p>Online and offline players and characters</p></div><div class="pm-hbtns"><button class="pm-btn ghost">${ic('heart-pulse')}Revive everyone</button><button class="pm-btn ghost">${ic('briefcase-medical')}Heal everyone</button></div></header>
  <div class="pm-kpis card">
    <div class="on">${ic('signal', 'ok')}<b><span data-k="online">38</span> / 64</b><small>online</small></div>
    <div>${ic('shield-check')}<b>4</b><small>staff online</small></div>
    <div>${ic('skull')}<b>2</b><small>dead</small></div>
    <div>${ic('link')}<b>2</b><small>cuffed</small></div>
    <div>${ic('wifi')}<b>34 ms</b><small>average ping</small></div>
  </div>
  <div class="pm-toolbar"><div class="pm-tabs"><button class="on">Online <small>38</small></button><button>Everyone <small>3,120</small></button><button>Staff</button><button>Offline</button></div><label class="pm-search">${ic('search')}<input placeholder="Name, ID or identifier" spellcheck="false"></label><div class="pm-select">All jobs ${ic('chevron-down')}</div></div>
  <div class="card pm-table">
    <div class="pm-tr th"><span>ID</span><span>Player</span><span>Job</span><span>Group</span><span>Ping</span><span></span></div>
    <div class="pm-tbody" data-k="players"></div>
  </div>
</div>

<div class="pm-view" data-view="tickets">
  <header class="pm-h"><div><h3>Tickets</h3><p>Questions and reports from players</p></div><div class="pm-hbtns"><div class="pm-tabs"><button class="on">${ic('columns-3')}Board</button><button>${ic('archive')}Archive</button></div></div></header>
  <div class="pm-board">
    <div class="pm-col" data-col="open"><h5><i class="sq info"></i>Open <small>2</small></h5><div class="pm-cards"></div></div>
    <div class="pm-col" data-col="progress"><h5><i class="sq warn"></i>In progress <small>1</small></h5><div class="pm-cards"></div></div>
    <div class="pm-col" data-col="done"><h5><i class="sq ok"></i>Done <small>0</small></h5><div class="pm-cards"></div></div>
  </div>
</div>

<div class="pm-view" data-view="bans">
  <header class="pm-h"><div><h3>Bans</h3><p>Every ban on the server</p></div><div class="pm-hbtns"><button class="pm-btn">${ic('plus')}Add ban</button></div></header>
  <div class="pm-toolbar"><div class="pm-tabs"><button class="on">Active <small>12</small></button><button>Expired</button><button>All</button></div><label class="pm-search">${ic('search')}<input placeholder="Search bans" readonly></label></div>
  <div class="card pm-table bans"><div class="pm-tr th"><span>Player</span><span>Reason</span><span>By</span><span>Date</span><span>Ends</span></div><div class="pm-tbody" data-k="bans"></div></div>
</div>

<div class="pm-view" data-view="logs">
  <header class="pm-h"><div><h3>Logs</h3><p>Every staff action, searchable</p></div><div class="pm-hbtns"><button class="pm-btn ghost">${ic('download')}Export CSV</button></div></header>
  <div class="pm-toolbar"><label class="pm-search">${ic('search')}<input placeholder="Search logs" readonly></label><div class="pm-tabs"><button>Today</button><button>7 days</button><button class="on">30 days</button></div></div>
  <div class="card pm-logs"><ul data-k="logs"></ul></div>
</div>

<div class="pm-view" data-view="economy">
  <header class="pm-h"><div><h3>Economy</h3><p>All money across every character</p></div><div class="pm-hbtns"><button class="pm-btn ghost">${ic('refresh-cw')}Recalculate</button></div></header>
  <div class="pm-stats five">
    <div class="card"><span>${ic('landmark')}Total</span><b>€54.1M</b><small>9,422 characters</small></div>
    <div class="card"><span>${ic('banknote')}Cash</span><b>€3.9M</b><small>7%</small></div>
    <div class="card"><span>${ic('landmark')}Bank</span><b>€50.2M</b><small>93%</small></div>
    <div class="card"><span>${ic('eye-off')}Black money</span><b>€612K</b><small>not in total</small></div>
    <div class="card"><span>${ic('scale')}Average</span><b>€5.7K</b><small>median €2.1K</small></div>
  </div>
  <div class="pm-row2">
    <div class="card pm-eco"><div class="pm-chart-h"><b>Money in circulation</b><div class="pm-tabs sm"><button class="on">Total</button><button>Cash</button><button>Bank</button></div></div>
      <svg viewBox="0 0 640 170" preserveAspectRatio="none" class="pm-svg eco"><defs><linearGradient id="e-${this.uid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--text)" stop-opacity=".18"/><stop offset="1" stop-color="var(--text)" stop-opacity="0"/></linearGradient></defs>${[0, 1, 2, 3].map((i) => `<line x1="0" x2="640" y1="${i * 56}" y2="${i * 56}" class="grid"/>`).join('')}<path class="area" fill="url(#e-${this.uid})"/><path class="line mono"/></svg>
    </div>
    <div class="card pm-dist"><h4>Distribution</h4><div data-k="dist"></div><small>Characters per wealth band (cash + bank).</small></div>
  </div>
  <div class="card pm-table rich"><div class="pm-tr th"><span>#</span><span>Character</span><span>Cash</span><span>Bank</span><span>Total</span></div><div class="pm-tbody" data-k="rich"></div></div>
</div>

<div class="pm-view" data-view="map">
  <div class="pm-map">
    <div class="pm-map-canvas"><img src="assets/img/map.webp" alt="" loading="lazy" decoding="async"><div class="pm-dots" data-k="dots"></div></div>
    <div class="pm-map-top"><span class="pm-pill"><b>Map</b><i class="dot ok pulse"></i><span data-k="online">38</span> players on the map</span><div class="pm-tabs"><button class="on">Satellite HD</button><button>Satellite</button><button>Dark</button><button>3D</button></div></div>
    <div class="pm-map-zoom"><button>${ic('plus')}</button><button>${ic('minus')}</button><button>${ic('expand')}</button></div>
    <div class="pm-coords" data-k="coords">-254, -987</div>
  </div>
  <aside class="pm-map-list"><label class="pm-search">${ic('search')}<input placeholder="Name, ID or plate" readonly></label><div class="pm-chips tight"><span class="pm-chip on">All 38</span><span class="pm-chip">On foot 21</span><span class="pm-chip">Driving 15</span><span class="pm-chip">Staff 4</span><span class="pm-chip">Dead 2</span></div><ul data-k="maplist"></ul></aside>
</div>

<div class="pm-view" data-view="gameview">
  <header class="pm-h"><div><h3>GameView</h3><p>Watch player screens live <span class="pm-count">● 1</span></p></div></header>
  <div class="pm-gv">
    <div class="card pm-gv-feed"><div class="pm-gv-bar"><span class="pm-av sm">RM</span><b>Rico Martens</b><small>#4</small><span class="r"><span data-k="fps">640×360 · 26 fps</span><em class="live">● LIVE</em></span></div><div class="pm-gv-img"><img src="assets/img/gameview-feed.webp" alt="" loading="lazy" decoding="async"><i class="scan"></i></div></div>
    <aside class="pm-gv-list"><label class="pm-search">${ic('search')}<input placeholder="Name or ID" readonly></label><small>38 online</small>${PLAYERS.slice(0, 7).map((p, i) => `<div class="pm-gv-item ${i === 0 ? 'on' : ''}"><span class="pm-av sm">${p.ini}</span><div><b>${p.name}</b><small>#${p.id} · ${p.ping}ms</small></div>${i === 0 ? '<em>Stop</em>' : '<em class="ghost">Watch</em>'}</div>`).join('')}</aside>
  </div>
</div>

<div class="pm-view" data-view="devtools">
  <div class="pm-tabs big"><button class="on">${ic('square-terminal')}Console</button><button>${ic('scan-search')}Entity inspector</button><button>${ic('crosshair')}Placer</button><button>${ic('boxes')}Resources</button></div>
  <div class="pm-dev-bar"><div class="pm-tabs"><button class="on">${ic('monitor')}Client</button><button>${ic('server')}Server</button></div><span class="pm-hint">Ctrl+Enter run · Alt+↑ history</span><button class="pm-btn" data-act="run">${ic('play')}Run</button></div>
  <div class="card pm-code"><div class="pm-gutter">1<br>2<br>3</div><pre data-k="code"></pre></div>
  <div class="card pm-out"><h4>Output <button class="pm-link">${ic('trash-2')}Clear</button></h4><pre data-k="out"><span class="mute">Nothing run yet</span></pre></div>
</div>

<div class="pm-view" data-view="settings">
  <div class="card pm-set">
    <h4>Appearance</h4>
    <div class="pm-set-row col"><b>Theme</b><div class="pm-themes" data-k="themes"></div></div>
    <div class="pm-set-row"><div><b>Accent colour</b><small>Buttons, selections and charts</small></div><div class="pm-sw" data-k="accents"></div></div>
    <div class="pm-set-row"><div><b>Density</b><small>Compact fits more rows on screen</small></div><div class="pm-tabs"><button class="on">Comfortable</button><button>Compact</button></div></div>
    <div class="pm-set-row"><div><b>Corners</b></div><div class="pm-tabs" data-k="corners"><button data-r="2">Sharp</button><button data-r="8">Default</button><button class="on" data-r="12">Round</button></div></div>
    <div class="pm-set-row"><div><b>Animations</b><small>Off = everything instant, no transitions</small></div><span class="pm-toggle on"><i></i></span></div>
    <div class="pm-set-row"><div><b>Opacity</b><small>Lower = see the game behind it</small></div><div class="pm-range"><i style="--w:92%"></i><b>95%</b></div></div>
  </div>
</div>

<div class="pm-view" data-view="soon">
  <div class="pm-soon">${ic('sparkles')}<h3 data-k="soon-t">Vehicles</h3><p>This page is part of the full panel. The live demo shows the core views — the real thing has every page.</p></div>
</div>`;
    }

    $(s) { return this.root.querySelector(s); }
    $$(s) { return [...this.root.querySelectorAll(s)]; }
    set(k, v) { this.$$(`[data-k="${k}"]`).forEach((el) => { el.textContent = v; }); }

    renderPlayers() {
      const box = this.$('[data-k="players"]');
      box.innerHTML = PLAYERS.map((p) => {
        const [g, gc] = GROUP[p.group];
        return `<div class="pm-tr" data-player="${p.id}" data-name="${p.name.toLowerCase()}"><span class="mono">${p.id}</span><span class="pm-pl"><span class="pm-av">${p.ini}</span><span><b>${p.name}</b><small class="mono">char1:${(p.id * 2654435761 >>> 0).toString(16)}e8f2b17c5718</small></span></span><span><b>${p.job}</b><small>${p.grade || 'No grade'}</small></span><span>${g ? `<em class="tag ${gc}">● ${g}</em>` : '<small>—</small>'}</span><span class="ping ${p.ping > 55 ? 'warn' : 'ok'}"><i class="dot"></i>${p.ping}ms</span><span class="pm-acts">${ic('heart-pulse')}${ic('navigation')}${ic('eye')}<button class="pm-btn sm" data-open="${p.id}">File</button></span></div>`;
      }).join('');
    }

    filter(q) {
      q = q.trim().toLowerCase();
      this.$$('[data-k="players"] .pm-tr').forEach((r) => r.classList.toggle('hide', !!q && !r.dataset.name.includes(q) && !r.dataset.player.startsWith(q)));
    }

    renderTickets() {
      const T = [
        ['open', 302, 'Bug', 'My ambulance does not spawn at the garage, I only get an error in F8.', 'Lotte Janssen', 'LJ', 'info'],
        ['open', 304, 'Player', 'There is a player in the bank not doing any RP, can an admin take a look?', 'Fenna Bakker', 'FB', 'bad'],
        ['progress', 299, 'Question', 'How do I apply for the police department?', 'Milan de Vries', 'MV', 'violet'],
      ];
      T.forEach(([col, id, type, txt, who, ini, c]) => {
        this.$(`[data-col="${col}"] .pm-cards`).insertAdjacentHTML('beforeend', `<div class="pm-tk" data-ticket="${id}"><small class="mono">#${id} <em class="tag ${c}">${type}</em></small><p>${txt}</p><div><span class="pm-av xs">${ini}</span>${who}<span class="r mono">${id === 302 ? '9m' : id === 304 ? '21m' : '1h'}</span></div></div>`);
      });
    }

    renderBans() {
      const B = [
        ['Rico Martens', 'RDM at Legion Square', 'Sem de Boer', '7 days'],
        ['Kevin de Wit', 'Modded menu detected — Eulen', 'Anticheat', 'Permanent'],
        ['Sanne Bos', 'Exploiting a vehicle duplication bug', 'Daan Visser', '30 days'],
        ['Jesse Kok', 'Advertising another server in chat', 'Sem de Boer', '14 days'],
        ['Mees Dekker', 'Repeated FRP after two warnings', 'Daan Visser', '3 days'],
        ['Nina Jacobs', 'Combat logging during a chase', 'Sem de Boer', '2 days'],
        ['Thijs Vos', 'Harassment in voice chat', 'Daan Visser', '7 days'],
      ];
      this.$('[data-k="bans"]').innerHTML = B.map(([n, r, by, end], i) => `<div class="pm-tr${i === 0 ? ' new' : ''}"><span><b>${n}</b><small class="mono">license:${(i * 977 + 4096).toString(16)}a8f1…</small></span><span>${r}</span><span>${by}</span><span class="mono">${28 - i} Oct 2026, ${pad(10 + i)}:${pad(i * 7)}</span><span><em class="tag ${end === 'Permanent' ? 'bad' : 'warn'}">${end}</em></span></div>`).join('');
    }

    renderLogs() {
      this.$('[data-k="logs"]').innerHTML = STAFF_LOG.slice().reverse().map(([i, c, t], n) => `<li>${ic(i, c)}<div><b>${t}</b><small>Staff · ${n === 0 ? 'just now' : `${n * 4}m ago`}</small></div><span class="mono">${clock(new Date(Date.now() - n * 240000))}</span></li>`).join('');
    }

    renderEconomy() {
      const d = [['< €1,000', 1840], ['€1,000 – €10K', 3120], ['€10K – €100K', 2950], ['€100K – €1M', 1460], ['> €1M', 52]];
      const max = 3120;
      this.$('[data-k="dist"]').innerHTML = d.map(([l, v]) => `<div class="pm-db"><i style="--w:${(v / max) * 100}%"></i><span>${l}</span><b>${v.toLocaleString('en')}</b></div>`).join('');
      const R = [['Sem de Boer', 860, 2330000], ['Julia Meijer', 5100, 1390000], ['Sophie Peters', 1300, 880000], ['Daan Visser', 2400, 610000], ['Rico Martens', 4718, 118450]];
      const f = (v) => (v >= 1e6 ? `€${(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `€${(v / 1e3).toFixed(1)}K` : `€${v.toLocaleString('en')}`);
      this.$('[data-k="rich"]').innerHTML = R.map(([n, c, b], i) => `<div class="pm-tr"><span class="mono">${i + 1}</span><span><b>${n}</b></span><span class="mono">${f(c)}</span><span class="mono">${f(b)}</span><span class="mono"><b>${f(b + c)}</b></span></div>`).join('');
      const p = pathFrom(this.ecoVals, 640, 170, 60);
      this.$('.eco .line').setAttribute('d', p);
      this.$('.eco .area').setAttribute('d', `${p}L640,170L0,170Z`);
    }

    renderMapDots() {
      const box = this.$('[data-k="dots"]');
      this.dots = Array.from({ length: 26 }, (_, i) => {
        const city = i < 18;
        const x = city ? rnd(38, 62) : rnd(20, 80);
        const y = city ? rnd(58, 80) : rnd(12, 60);
        const kind = i === 0 ? 'me' : i < 4 ? 'staff' : i === 5 ? 'dead' : i % 3 === 0 ? 'car' : '';
        const el = document.createElement('i');
        el.className = `pm-dot ${kind}`;
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        box.appendChild(el);
        return { el, x, y, vx: rnd(-0.05, 0.05), vy: rnd(-0.05, 0.05), kind };
      });
      this.dots[0].el.innerHTML = '<span>Rico Martens</span>';
      this.$('[data-k="maplist"]').innerHTML = PLAYERS.map((p) => `<li><span class="pm-av xs">${p.ini}</span><div><b>${p.name}</b><small>${p.job}${p.grade ? ` · ${p.grade}` : ''}</small></div><i class="dot ${p.group !== 'user' ? 'violet' : 'ok'}"></i><span class="mono">#${p.id}</span></li>`).join('');
    }

    renderSettings() {
      const names = { black: 'Black', blue: 'Blue', red: 'Red', light: 'Light' };
      this.$('[data-k="themes"]').innerHTML = THEMES.map((t) => `<button class="pm-theme ${t}${t === 'black' ? ' on' : ''}" data-theme-set="${t}"><span><i></i><i></i><i></i></span><b>${names[t]}</b></button>`).join('');
      this.$('[data-k="accents"]').innerHTML = ACCENTS.map((c, i) => `<button style="--c:${c}" data-accent="${c}" class="${i === 0 ? 'on' : ''}" aria-label="Accent ${c}"></button>`).join('');
    }

    setTheme(t) {
      this.root.dataset.theme = t;
      this.$$('[data-theme-set]').forEach((b) => b.classList.toggle('on', b.dataset.themeSet === t));
      this.emit('theme', t);
    }

    setAccent(c) {
      this.root.style.setProperty('--accent', c);
      this.$$('[data-accent]').forEach((b) => b.classList.toggle('on', b.dataset.accent === c));
    }

    setCorners(r) {
      this.root.style.setProperty('--r', `${r}px`);
      this.root.style.setProperty('--r-lg', `${Math.round(r * 1.5)}px`);
      this.$$('[data-k="corners"] button').forEach((b) => b.classList.toggle('on', b.dataset.r === String(r)));
    }

    go(view, instant = false) {
      let target = view;
      if (view.startsWith('x-')) {
        target = 'soon';
        const label = NAV.flatMap((g) => g[1]).find((n) => n[0] === view);
        this.set('soon-t', label ? label[2] : 'More');
      }
      if (this.view === view) return;
      this.closeProfile();
      this.closeDialog();
      this.view = view;
      this.$$('.pm-nav[data-go]').forEach((b) => b.classList.toggle('on', b.dataset.go === view));
      this.$$('.pm-view').forEach((v) => {
        const on = v.dataset.view === target;
        v.classList.toggle('on', on);
        if (on && !instant) {
          v.classList.remove('enter');
          void v.offsetWidth;
          v.classList.add('enter');
        }
      });
      if (target === 'dashboard') this.drawChart(true);
      if (target === 'economy') this.$$('.eco .line').forEach((l) => { l.classList.remove('draw'); void l.getBBox(); l.classList.add('draw'); });
      this.emit('view', view);
    }

    drawChart(animate) {
      const p = pathFrom(this.chartVals, 640, 150, 64);
      const line = this.$('.pm-svg:not(.eco) .line');
      line.setAttribute('d', p);
      this.$('.pm-svg:not(.eco) .area').setAttribute('d', `${p}L640,150L0,150Z`);
      const last = this.chartVals[this.chartVals.length - 1];
      const tip = this.$('.pm-svg:not(.eco) .tip');
      tip.setAttribute('cx', 640);
      tip.setAttribute('cy', 150 - (last / 64) * 150);
      if (animate) { line.classList.remove('draw'); void line.getBBox(); line.classList.add('draw'); }
    }

    updateSeg() {
      this.$$('.pm-seg i').forEach((el, i) => el.classList.toggle('on', i < this.online));
      this.set('online', this.online);
      this.set('fill', `${Math.round((this.online / 64) * 100)}% of the city is filled`);
    }

    pushFeed(first = false) {
      const ul = this.$('[data-k="feed"]');
      const p = pick(PLAYERS);
      const [icon, c, t] = pick(FEED);
      const li = document.createElement('li');
      li.innerHTML = `${ic(icon, c)}<span><b>${p.name}</b> ${t.replace('{p} ', '').replace('{j}', p.job)}</span><time class="mono">${clock()}</time>`;
      if (!first) li.classList.add('in');
      ul.prepend(li);
      while (ul.children.length > 6) ul.lastElementChild.remove();
    }

    pushLog() {
      const ul = this.$('[data-k="logs"]');
      const [i, c, t] = pick(STAFF_LOG);
      const li = document.createElement('li');
      li.className = 'in';
      li.innerHTML = `${ic(i, c)}<div><b>${t}</b><small>Staff · just now</small></div><span class="mono">${clock()}</span>`;
      ul.prepend(li);
      while (ul.children.length > 10) ul.lastElementChild.remove();
    }

    tick() {
      if (!this.running) return;
      const dOn = Math.random() < 0.5 ? -1 : 1;
      this.online = Math.max(30, Math.min(52, this.online + dOn));
      this.updateSeg();
      this.chartVals.shift();
      this.chartVals.push(Math.max(4, Math.min(60, this.chartVals[this.chartVals.length - 1] + rnd(-3, 3.4))));
      if (this.view === 'dashboard') this.drawChart(false);
      if (this.view === 'dashboard' && Math.random() < 0.8) this.pushFeed();
      if (this.view === 'logs') this.pushLog();
      this.uptime += 1;
      this.set('uptime', `${Math.floor(this.uptime / 60)}h ${pad(this.uptime % 60)}m`);
      this.set('clock', clock());
      this.set('fps', `640×360 · ${Math.round(rnd(24, 30))} fps`);
    }

    moveDots() {
      if (!this.running) return;
      if (this.view === 'map') {
        this.dots.forEach((d) => {
          if (d.kind === 'dead') return;
          const sp = d.kind === 'car' ? 3 : 1;
          d.vx += rnd(-0.01, 0.01); d.vy += rnd(-0.01, 0.01);
          d.vx = Math.max(-0.06, Math.min(0.06, d.vx)); d.vy = Math.max(-0.06, Math.min(0.06, d.vy));
          d.x = Math.max(12, Math.min(88, d.x + d.vx * sp)); d.y = Math.max(8, Math.min(90, d.y + d.vy * sp));
          d.el.style.left = `${d.x}%`; d.el.style.top = `${d.y}%`;
        });
        const me = this.dots[0];
        this.set('coords', `${Math.round((me.x - 50) * 80)}, ${Math.round((60 - me.y) * 90)}`);
      }
      this.raf = requestAnimationFrame(() => this.moveDots());
    }

    start() {
      if (this.running) return;
      this.running = true;
      if (!this.$('[data-k="feed"]').children.length) for (let i = 0; i < 6; i++) this.pushFeed(true);
      this.updateSeg();
      this.drawChart(false);
      this.tickTimer = setInterval(() => this.tick(), reduce ? 6000 : 2400);
      if (!reduce) this.moveDots();
    }

    stop() {
      this.running = false;
      clearInterval(this.tickTimer);
      cancelAnimationFrame(this.raf);
    }

    openProfile(id) {
      const p = PLAYERS.find((x) => x.id === Number(id)) || PLAYERS[0];
      this.current = p;
      const bar = (icon, label, v, c) => `<div class="pm-vital">${ic(icon, c)}<span>${label}</span><div class="pm-bar ${c}"><i style="--w:${v}%"></i></div><b>${v}</b></div>`;
      const btns = (title, c, list) => `<div class="pm-grp"><h6 class="${c}">${title}</h6><div class="pm-chips">${list.map(([i, t, cls, act]) => `<button class="pm-chip ${cls || ''}" ${act ? `data-act="${act}"` : ''}>${ic(i)}${t}</button>`).join('')}</div></div>`;
      const [g, gc] = GROUP[p.group];
      this.$('.pm-profile').innerHTML = `
<div class="pm-pf-side">
  <div class="pm-portrait"><span>${p.ini}</span><b>#${p.id}</b></div>
  <div class="pm-vitals">${bar('heart', 'Health', p.hp, 'bad')}${bar('shield', 'Armour', p.ar, 'info')}${bar('utensils', 'Hunger', p.hu, 'warn')}${bar('droplet', 'Thirst', p.th, 'mute')}</div>
  <h6>Jobs</h6><div class="pm-jobcard">${ic('briefcase')}<div><small>Job</small><b>${p.job}</b><small>${p.grade || '—'}</small></div></div>
  <h6>Money</h6><div class="pm-money"><div class="cash"><small>${ic('banknote')}Cash</small><b>€${p.cash.toLocaleString('en')}</b></div><div><small>${ic('landmark')}Bank</small><b>€${p.bank.toLocaleString('en')}</b></div></div>
</div>
<div class="pm-pf-main">
  <div class="pm-pf-head"><div><h3>${p.name} <em class="tag ok">● Online</em>${g ? `<em class="tag ${gc}">● ${g}</em>` : ''}${p.job === 'Politie' || p.job === 'Ambulance' ? '<em class="tag">On duty</em>' : ''}</h3><small class="mono">ID ${p.id} · ${ic('signal')} ${p.ping} ms · online for 46m</small></div><div class="pm-icons">${['heart-pulse', 'briefcase-medical', 'navigation', 'eye', 'camera', 'ellipsis'].map((i) => `<button>${ic(i)}</button>`).join('')}<button data-act="close">${ic('x')}</button></div></div>
  <div class="pm-pf-stats"><div><small>Play time</small><b>${p.time}</b></div><div><small>Sessions</small><b>${p.sessions}</b></div><div><small>Warnings</small><b>${p.warns}</b></div><div><small>Bans</small><b>${p.bans}</b></div><div><small>Notes</small><b>1</b></div><div><small>Tickets</small><b>2</b></div></div>
  <div class="pm-pf-tabs">${['Overview', 'Inventory', 'Vehicles', 'Properties', 'Notes', 'Warnings', 'Timeline', 'Bans', 'Sessions'].map((t, i) => `<span class="${i === 0 ? 'on' : ''}">${t}</span>`).join('')}</div>
  <div class="pm-pf-body">
    ${btns('Health', 'ok', [['heart-pulse', 'Revive'], ['briefcase-medical', 'Heal'], ['utensils', 'Feed'], ['wind', 'Clear stress'], ['shield', 'Set armour']])}
    ${btns('Teleport', 'info', [['navigation', 'Go to'], ['magnet', 'Bring'], ['map-pin', 'To location'], ['eye', 'Spectate'], ['map', 'On map']])}
    ${btns('Character', 'violet', [['shirt', 'Clothing'], ['id-card', 'Change name'], ['briefcase', 'Change job'], ['banknote', 'Money']])}
    ${btns('Items', 'warn', [['backpack', 'Open inventory'], ['square-plus', 'Give item'], ['key', 'Give keys'], ['camera', 'Screenshot'], ['message-circle', 'Send message']])}
    ${btns('Punish', 'bad', [['snowflake', 'Freeze'], ['link', 'Cuff'], ['lock', 'Jail'], ['triangle-alert', 'Warn'], ['skull', 'Kill', 'danger'], ['door-open', 'Kick', 'danger'], ['gavel', 'Ban', 'danger', 'ban']])}
  </div>
</div>`;
      this.root.classList.add('modal-open');
      this.$('.pm-profile').classList.add('on');
      this.emit('profile', p);
    }

    closeProfile() {
      this.root.classList.remove('modal-open');
      this.$('.pm-profile').classList.remove('on');
    }

    openBan() {
      const p = this.current || PLAYERS[0];
      this.$('.pm-dialog').innerHTML = `
<h4>${ic('gavel', 'bad')}Ban ${p.name}</h4>
<label>Quick reasons</label>
<div class="pm-chips tight">${['Modded menu', 'RDM', 'VDM', 'Fail RP', 'Combat logging'].map((r, i) => `<button class="pm-chip ${i === 1 ? 'on' : ''}" data-reason>${r}</button>`).join('')}</div>
<label>Reason</label>
<div class="pm-input" data-k="reason">RDM at Legion Square</div>
<label>Duration</label>
<div class="pm-tabs dur">${['1h', '1d', '3d', '7d', '30d', 'Perm'].map((d) => `<button data-dur="${d}" class="${d === '1d' ? 'on' : ''}">${d}</button>`).join('')}</div>
<div class="pm-dlg-foot"><button class="pm-btn ghost" data-act="cancel">Cancel</button><button class="pm-btn danger" data-act="confirm-ban">${ic('gavel')}Ban</button></div>`;
      this.root.classList.add('dialog-open');
      this.$('.pm-dialog').classList.add('on');
    }

    pickDuration(d) { this.$$('[data-dur]').forEach((b) => b.classList.toggle('on', b.dataset.dur === d)); }

    closeDialog() {
      this.root.classList.remove('dialog-open');
      const d = this.$('.pm-dialog');
      if (d) d.classList.remove('on');
    }

    confirmBan() {
      const p = this.current || PLAYERS[0];
      const dur = (this.$('[data-dur].on') || {}).dataset?.dur || '7d';
      this.closeDialog();
      this.closeProfile();
      this.toast('gavel', `${p.name} banned · ${dur === 'Perm' ? 'permanent' : dur}`, 'bad');
      const b = Number(this.$('[data-k="bancount"]').textContent) || 1;
      this.set('bancount', b + 1);
      this.$$('[data-player]').forEach((r) => { if (Number(r.dataset.player) === p.id) r.classList.add('gone'); });
      this.emit('banned', p);
    }

    toast(icon, text, kind = 'ok') {
      const box = this.$('.pm-toasts');
      const t = document.createElement('div');
      t.className = `pm-toast ${kind}`;
      t.innerHTML = `${ic(icon)}<span>${text}</span>`;
      box.appendChild(t);
      setTimeout(() => t.classList.add('out'), 2800);
      setTimeout(() => t.remove(), 3300);
    }

    async typeInto(sel, text, speed = 70) {
      const el = this.$(sel);
      if (!el) return;
      const isInput = el.tagName === 'INPUT';
      let cur = '';
      for (const ch of text) {
        cur += ch;
        if (isInput) { el.value = cur; el.dispatchEvent(new Event('input')); } else el.textContent = cur;
        await wait(reduce ? 0 : speed + rnd(-20, 30));
      }
    }

    async typeCode() {
      const pre = this.$('[data-k="code"]');
      const code = 'local ped = PlayerPedId()\nprint(GetEntityCoords(ped))';
      pre.innerHTML = '';
      let out = '';
      for (const ch of code) {
        out += ch;
        pre.innerHTML = this.hl(out) + '<i class="caret"></i>';
        await wait(reduce ? 0 : 38 + rnd(-15, 25));
      }
      pre.innerHTML = this.hl(out);
    }

    hl(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/\b(local|print|function|end|return)\b/g, '<span class="kw">$1</span>')
        .replace(/\b(PlayerPedId|GetEntityCoords)\b/g, '<span class="fn">$1</span>');
    }

    runCode() {
      const out = this.$('[data-k="out"]');
      out.innerHTML = `<span class="mute">${clock()} › client</span>\n<span class="ok">vector3(-254.12, -987.44, 31.22)</span>`;
      out.classList.remove('flash');
      void out.offsetWidth;
      out.classList.add('flash');
    }

    async moveTicket() {
      const card = this.$('[data-ticket="302"]');
      const dest = this.$('[data-col="progress"] .pm-cards');
      if (!card || !dest || card.parentElement === dest) return;
      const a = card.getBoundingClientRect();
      dest.prepend(card);
      const b = card.getBoundingClientRect();
      const s = this.scale || 1;
      card.animate([{ transform: `translate(${(a.left - b.left) / s}px, ${(a.top - b.top) / s}px) rotate(-2deg)`, boxShadow: '0 30px 60px rgba(0,0,0,.6)' }, { transform: 'none' }], { duration: reduce ? 0 : 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
      card.querySelector('.r').textContent = 'Claimed';
      this.$('[data-col="open"] h5 small').textContent = '1';
      this.$('[data-col="progress"] h5 small').textContent = '2';
    }

    resetTicket() {
      const card = this.$('[data-ticket="302"]');
      const src = this.$('[data-col="open"] .pm-cards');
      if (card && src && card.parentElement !== src) {
        src.prepend(card);
        card.querySelector('.r').textContent = '9m';
        this.$('[data-col="open"] h5 small').textContent = '2';
        this.$('[data-col="progress"] h5 small').textContent = '1';
      }
    }

    resetPlayers() {
      this.$$('[data-player]').forEach((r) => r.classList.remove('gone'));
      const s = this.$('.pm-search input');
      if (s) { s.value = ''; this.filter(''); }
    }

    async cursorTo(sel, click = true) {
      const el = typeof sel === 'string' ? this.$(sel) : sel;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const box = this.root.getBoundingClientRect();
      const s = this.scale || 1;
      const x = (r.left - box.left + r.width * 0.5) / s;
      const y = (r.top - box.top + r.height * 0.55) / s;
      this.cursor.classList.add('on');
      this.cursor.style.transform = `translate(${x}px, ${y}px)`;
      await wait(reduce ? 50 : 650);
      if (click) {
        this.cursor.classList.add('click');
        el.classList.add('pressed');
        await wait(160);
        this.cursor.classList.remove('click');
        el.classList.remove('pressed');
      }
    }

    hideCursor() { this.cursor.classList.remove('on'); }

    onClick(e) {
      if (!this.opts.interactive) return;
      const t = e.target.closest('button, .pm-tr[data-player], [data-theme-set], [data-accent], [data-dur], [data-r], .pm-veil');
      if (!t) return;
      this.emit('user');
      if (t.classList.contains('pm-veil')) { this.closeDialog(); this.closeProfile(); return; }
      if (t.dataset.go) { if (t.dataset.go === 'players' && this.view !== 'players') this.resetPlayers(); return this.go(t.dataset.go); }
      if (t.dataset.open) return this.openProfile(t.dataset.open);
      if (t.dataset.player) return this.openProfile(t.dataset.player);
      if (t.dataset.themeSet) return this.setTheme(t.dataset.themeSet);
      if (t.dataset.accent) return this.setAccent(t.dataset.accent);
      if (t.dataset.dur) return this.pickDuration(t.dataset.dur);
      if (t.dataset.r) return this.setCorners(Number(t.dataset.r));
      const act = t.dataset.act;
      if (act === 'close') return this.closeProfile();
      if (act === 'ban') return this.openBan();
      if (act === 'cancel') return this.closeDialog();
      if (act === 'confirm-ban') return this.confirmBan();
      if (act === 'run') { if (!this.$('[data-k="code"]').textContent) this.typeCode().then(() => this.runCode()); else this.runCode(); return; }
      if (t.classList.contains('pm-chip') && t.closest('.pm-pf-body')) return this.toast('circle-check', `${t.textContent.trim()} → ${this.current ? this.current.name : 'player'}`, 'ok');
      if (t.classList.contains('pm-chip') && t.closest('.pm-qa')) return this.toast('zap', `${t.textContent.trim()} toggled`, 'info');
      if (t.closest('.pm-tabs') && !t.dataset.dur) { [...t.parentElement.children].forEach((c) => c.classList.toggle('on', c === t)); }
    }
  }

  window.PanelMock = PanelMock;
  window.PanelIcon = ic;
  window.panelWait = wait;
})();
