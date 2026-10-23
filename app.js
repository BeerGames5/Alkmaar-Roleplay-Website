/* Dit bestand draait in de BROWSER van de bezoeker, niet op de server.
   Het haalt de live gegevens op en tekent het team. */

const getJSON = (url) =>
  fetch(url, { headers: { Accept: 'application/json' } }).then((r) => {
    if (!r.ok) throw new Error(`${url} gaf status ${r.status}`);
    return r.json();
  });

/* ---------- Serverstatus ---------- */

async function laadStatus() {
  try {
    const { server, discord } = await getJSON('/api/status');

    const dot = document.getElementById('dotState');
    const state = document.getElementById('serverState');

    dot.className = `dot ${server.online ? 'dot-on' : 'dot-off'}`;
    state.textContent = server.online ? 'Online' : 'Offline';

    document.getElementById('playerCount').textContent = server.online
      ? `${server.clients} / ${server.maxClients}`
      : '—';

    document.getElementById('queueCount').textContent = server.online ? String(server.queue) : '—';

    document.getElementById('discordCount').textContent = discord?.members
      ? discord.members.toLocaleString('nl-NL')
      : '—';

    const footer = document.getElementById('footerStatus');
    if (footer) {
      footer.textContent = server.online
        ? `${server.clients} spelers in de stad · bijgewerkt ${new Date(server.updatedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
        : 'Server is op dit moment offline';
    }
  } catch (err) {
    document.getElementById('serverState').textContent = 'onbekend';
    console.error(err);
  }
}

/* ---------- Ledenaantallen bij de divisies ---------- */

async function laadCommunities() {
  try {
    const communities = await getJSON('/api/communities');
    for (const c of communities) {
      const el = document.querySelector(`[data-count="${c.key}"]`);
      if (!el) continue;
      el.textContent = c.members
        ? `${c.members.toLocaleString('nl-NL')} leden · ${(c.online ?? 0).toLocaleString('nl-NL')} online`
        : 'Discord openen';
    }
  } catch (err) {
    console.error(err);
  }
}

/* ---------- Team ---------- */

function staffKaart(member, kleur) {
  const el = document.createElement('div');
  el.className = 'staff-card';
  el.style.setProperty('--role', kleur);

  const img = document.createElement('img');
  img.src = member.avatar;
  img.alt = '';
  img.loading = 'lazy';
  img.width = 46;
  img.height = 46;

  const tekst = document.createElement('div');
  tekst.style.minWidth = '0';

  const naam = document.createElement('div');
  naam.className = 'staff-name';
  naam.textContent = member.name;

  const handle = document.createElement('div');
  handle.className = 'staff-handle';
  handle.textContent = `@${member.username}`;

  tekst.append(naam, handle);
  el.append(img, tekst);
  return el;
}

async function laadStaff() {
  const doel = document.getElementById('staffContent');

  try {
    const data = await getJSON('/api/staff');

    if (!data.configured || data.groups.length === 0) {
      doel.className = 'empty-state';
      doel.innerHTML = `
        <h3>Nog geen team gekoppeld</h3>
        <p>Zet de Discord-bot aan om het team hier automatisch te tonen. Nodig: de omgevingsvariabelen
        <code>DISCORD_BOT_TOKEN</code>, <code>DISCORD_GUILD_ID</code> en <code>DISCORD_STAFF_ROLES</code>,
        met "Server Members Intent" aangezet in het Discord Developer Portal.</p>
        <p>De volledige uitleg staat in het bestand <code>README.md</code> van dit project.</p>`;
      return;
    }

    doel.className = 'staff-groups';
    doel.textContent = '';

    for (const groep of data.groups) {
      const sectie = document.createElement('div');
      sectie.className = 'staff-group';

      const kop = document.createElement('div');
      kop.className = 'staff-group-head';
      kop.innerHTML = `<h3 style="color:${groep.color}">${groep.label}</h3><hr><span class="staff-group-count">${groep.members.length}</span>`;

      const grid = document.createElement('div');
      grid.className = 'staff-grid';
      for (const lid of groep.members) grid.append(staffKaart(lid, groep.color));

      sectie.append(kop, grid);
      doel.append(sectie);
    }
  } catch (err) {
    doel.className = 'empty-state';
    doel.innerHTML = `<h3>Team kon niet geladen worden</h3><p>Probeer de pagina te verversen. Blijft het misgaan, meld het dan in Support.</p>`;
    console.error(err);
  }
}


/* ---------- Tebex-webshop ---------- */
function tekstUitHtml(value) {
  const documentFragment = new DOMParser().parseFromString(String(value || ''), 'text/html');
  return (documentFragment.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function formatteerPrijs(value, currency) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 'Prijs in checkout';
  try {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: /^[A-Z]{3}$/.test(currency || '') ? currency : 'EUR',
    }).format(amount);
  } catch {
    return `€ ${amount.toFixed(2).replace('.', ',')}`;
  }
}

async function laadWebshop() {
  const knop = document.getElementById('shopBuyButton');
  const status = document.getElementById('shopStatus');
  if (!knop || !status) return;

  const naam = document.getElementById('shopProductName');
  const beschrijving = document.getElementById('shopProductDescription');
  const afbeelding = document.getElementById('shopProductImage');
  const prijs = document.getElementById('shopProductPrice');
  const belasting = document.getElementById('shopProductTax');

  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle('is-error', error);
  };

  try {
    const response = await getJSON('/api/shop/product');
    const product = response.product || {};

    naam.textContent = product.name || 'Alkmaar Admin Panel V2';
    beschrijving.textContent = tekstUitHtml(product.description) || 'FiveM Asset voor je server.';
    prijs.textContent = formatteerPrijs(product.totalPrice, product.currency);
    belasting.textContent = Number(product.salesTax) > 0
      ? 'Totaal volgens Tebex; checkout bevestigt de prijs'
      : 'De definitieve prijs verschijnt in Tebex';

    if (typeof product.image === 'string') {
      try {
        const imageUrl = new URL(product.image);
        if (imageUrl.protocol === 'https:') {
          afbeelding.src = imageUrl.href;
          afbeelding.alt = naam.textContent;
        }
      } catch {
        // Laat de vaste standaardafbeelding staan bij een ongeldige URL.
      }
    }

    if (!response.checkoutEnabled) {
      knop.disabled = true;
      knop.textContent = 'Checkout nog niet ingesteld';
      setStatus('De productkaart staat klaar, maar de Tebex Public Token moet nog bij de Environment-variabelen van Render worden ingevuld.');
      return;
    }

    knop.disabled = false;
    knop.textContent = 'Kopen via Tebex';
    setStatus(response.note || 'Je koppelt eerst je Cfx.re-account en gaat daarna veilig verder naar Tebex.');

    knop.addEventListener('click', async () => {
      knop.disabled = true;
      knop.textContent = 'Checkout voorbereiden…';
      setStatus('We maken je winkelmandje aan en openen de Cfx.re-accountkoppeling.');

      try {
        const result = await fetch('/api/shop/checkout', {
          method: 'POST',
          headers: { Accept: 'application/json' },
        });
        const data = await result.json().catch(() => ({}));
        if (!result.ok) throw new Error(data.error || 'De checkout kon niet gestart worden.');

        let redirect;
        try { redirect = new URL(data.redirectUrl); } catch { throw new Error('Tebex gaf geen geldige accountkoppeling terug.'); }
        if (redirect.protocol !== 'https:' || redirect.hostname !== 'ident.tebex.io') {
          throw new Error('Tebex gaf geen vertrouwde Cfx.re-accountkoppeling terug.');
        }
        window.location.assign(redirect.href);
      } catch (err) {
        setStatus(err.message || 'Er ging iets mis bij het openen van Tebex. Probeer opnieuw.', true);
        knop.disabled = false;
        knop.textContent = 'Opnieuw proberen';
      }
    });
  } catch (err) {
    knop.disabled = true;
    knop.textContent = 'Product tijdelijk niet beschikbaar';
    setStatus('Productgegevens konden niet geladen worden. Ververs de pagina of probeer het later opnieuw.', true);
    console.error('Tebex-webshop laden mislukt:', err);
  }
}

/* ---------- Menu, kopieerknop en scroll ---------- */

function initUI() {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileNav');

  toggle?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
  });

  menu?.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  const topbar = document.getElementById('topbar');
  const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  document.getElementById('copyBtn')?.addEventListener('click', async (e) => {
    const knop = e.currentTarget;
    try {
      await navigator.clipboard.writeText(knop.dataset.copy);
      knop.textContent = 'Gekopieerd';
      setTimeout(() => (knop.textContent = 'Kopieer adres'), 2000);
    } catch {
      knop.textContent = 'Kopiëren lukte niet';
      setTimeout(() => (knop.textContent = 'Kopieer adres'), 2000);
    }
  });

  const jaar = document.getElementById('jaar');
  if (jaar) jaar.textContent = String(new Date().getFullYear());

  // Het logo staat er meteen als stilstaand plaatje; de animatie schuift er
  // pas achteraan in, zodat de pagina niet op een bestand van 1,4 MB wacht.
  const mark = document.getElementById('heroMark');
  const stilVoorkeur = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (mark && !stilVoorkeur) {
    window.addEventListener('load', () => {
      const bron = mark.dataset.animated;
      const voorlader = new Image();
      voorlader.onload = () => (mark.src = bron);
      voorlader.src = bron;
    });
  }

  // Markeert het menu-item van de sectie die je aan het lezen bent.
  const secties = [...document.querySelectorAll('main section[id]')];
  const links = new Map(
    [...document.querySelectorAll('.nav a')].map((a) => [a.getAttribute('href').slice(1), a])
  );

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((a) => a.classList.remove('active'));
        links.get(entry.target.id)?.classList.add('active');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  secties.forEach((s) => observer.observe(s));
}

initUI();
laadStatus();
laadStaff();
laadCommunities();
laadWebshop();
setInterval(laadStatus, 45000);
