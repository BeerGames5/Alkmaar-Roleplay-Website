(() => {
  if (!document.getElementById('checkout')) return;
  const TEBEX = {
    api: 'https://headless.tebex.io/api',
    token: '154aj-0de5bba26e1efdde8ff5b62bd1e3fd320dd683fa',
    packageId: 7770969,
    store: 'https://alkmaar-creator.tebex.store/',
  };
  const KEY = 'acr-basket';
  const account = (path = '') => `${TEBEX.api}/accounts/${encodeURIComponent(TEBEX.token)}${path}`;
  const base = () => new URL('.', location.href).href;

  async function call(url, opts = {}) {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000);
    let res;
    try {
      res = await fetch(url, { ...opts, signal: ctrl.signal, headers: { Accept: 'application/json', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) } });
    } catch {
      throw new Error('Tebex could not be reached. Check your connection and try again.');
    } finally {
      clearTimeout(to);
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const d = data && typeof data.detail === 'string' ? data.detail : '';
      throw new Error(d ? d.slice(0, 200) : `Tebex refused the request (HTTP ${res.status}).`);
    }
    return data && Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data;
  }

  const safeUrl = (value, hosts) => {
    try {
      const u = new URL(value);
      if (u.protocol === 'https:' && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))) return u.href;
    } catch {}
    throw new Error('Tebex returned a link we did not expect. Please use the Tebex store instead.');
  };

  const store = {
    get() { try { return sessionStorage.getItem(KEY); } catch { return null; } },
    set(v) { try { sessionStorage.setItem(KEY, v); } catch {} },
    clear() { try { sessionStorage.removeItem(KEY); } catch {} },
  };

  function money(v, cur) {
    try { return new Intl.NumberFormat(navigator.language || 'en', { style: 'currency', currency: cur }).format(v); } catch { return `${cur} ${Number(v).toFixed(2)}`; }
  }

  async function loadProduct() {
    try {
      const p = await call(account(`/packages/${TEBEX.packageId}`));
      const price = Number(p.total_price ?? p.base_price);
      const off = Number(p.discount) || 0;
      if (Number.isFinite(price) && p.currency) {
        document.querySelectorAll('[data-price]').forEach((el) => { el.textContent = money(price, p.currency); });
        if (off > 0) {
          const was = price + off;
          document.querySelectorAll('[data-price-was]').forEach((el) => { el.textContent = money(was, p.currency); });
          document.querySelectorAll('[data-price-off]').forEach((el) => { el.textContent = `Save ${money(off, p.currency)}`; });
          document.documentElement.classList.add('on-sale');
        }
      }
      if (p.name) document.querySelectorAll('[data-pkg-name]').forEach((el) => { el.textContent = String(p.name).split('|')[0].trim(); });
      if (p.image) {
        try { const u = safeUrl(p.image, ['cloudfront.net', 'tebex.io']); document.querySelectorAll('[data-pkg-img]').forEach((el) => { el.src = u; }); } catch {}
      }
    } catch {}
  }

  const ui = {
    el: document.getElementById('checkout'),
    open() { this.reset(); this.el.classList.add('on'); document.body.style.overflow = 'hidden'; },
    close() { this.el.classList.remove('on'); document.body.style.overflow = ''; },
    reset() {
      this.el.querySelectorAll('[data-co]').forEach((li) => li.classList.remove('active', 'done'));
      this.err('');
    },
    step(n) {
      this.el.querySelectorAll('[data-co]').forEach((li) => {
        const i = Number(li.dataset.co);
        li.classList.toggle('done', i < n);
        li.classList.toggle('active', i === n);
      });
    },
    err(msg) {
      const box = document.getElementById('coErr');
      box.textContent = msg;
      box.classList.toggle('on', !!msg);
      document.getElementById('coStore').hidden = !msg;
      if (msg) this.el.querySelectorAll('[data-co].active').forEach((li) => li.classList.remove('active'));
    },
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function startCheckout() {
    ui.open();
    try {
      ui.step(0);
      const basket = await call(account('/baskets'), {
        method: 'POST',
        body: JSON.stringify({
          complete_url: `${base()}bedankt.html`,
          cancel_url: `${base()}#pricing`,
          complete_auto_redirect: true,
          custom: { source: 'alkmaar-creator-website' },
        }),
      });
      const ident = String(basket && basket.ident || '');
      if (!/^[A-Za-z0-9_-]{8,160}$/.test(ident)) throw new Error('Tebex did not return a valid basket.');
      store.set(ident);
      const ret = `${base()}?basket=${encodeURIComponent(ident)}#pricing`;
      const auth = await call(account(`/baskets/${encodeURIComponent(ident)}/auth?returnUrl=${encodeURIComponent(ret)}`));
      const list = Array.isArray(auth) ? auth : [];
      const fivem = list.find((o) => /fivem|cfx/i.test(String(o && o.name || ''))) || list[0];
      if (!fivem || !fivem.url) throw new Error('The Cfx.re login could not be started.');
      ui.step(1);
      await sleep(500);
      location.href = safeUrl(fivem.url, ['tebex.io', 'cfx.re']);
    } catch (e) {
      ui.err(e.message);
    }
  }

  async function resumeCheckout(ident) {
    ui.open();
    ui.step(2);
    try {
      if (!/^[A-Za-z0-9_-]{8,160}$/.test(ident)) throw new Error('This basket is invalid or has expired. Please start again.');
      const url = account(`/baskets/${encodeURIComponent(ident)}`);
      const before = await call(url);
      const has = (before && Array.isArray(before.packages) ? before.packages : []).some((p) => [p.id, p.package_id, p.packageId].map(String).includes(String(TEBEX.packageId)));
      if (!has) {
        await call(`${TEBEX.api}/baskets/${encodeURIComponent(ident)}/packages`, { method: 'POST', body: JSON.stringify({ package_id: TEBEX.packageId, quantity: 1 }) });
      }
      const after = await call(url);
      const link = after && after.links && after.links.checkout;
      if (!link) throw new Error('The checkout could not be opened. Please start again.');
      ui.step(3);
      store.clear();
      await sleep(600);
      location.href = safeUrl(link, ['tebex.io']);
    } catch (e) {
      ui.err(e.message);
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-buy]')) { e.preventDefault(); startCheckout(); }
  });
  document.getElementById('coCancel').addEventListener('click', () => { ui.close(); store.clear(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.el.classList.contains('on')) ui.close(); });

  const params = new URLSearchParams(location.search);
  const back = params.get('basket');
  if (back) {
    history.replaceState(null, '', location.pathname + location.hash);
    resumeCheckout(back);
  }
  loadProduct();
})();
