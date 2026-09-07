/* Dit bestand draait in de BROWSER van de bezoeker, niet op de server.
   Het haalt de live gegevens op en tekent het team en de winkel. */

const euro = (cents) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);

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

/* ---------- Winkel ---------- */

function productKaart(p, actief) {
  const el = document.createElement('article');
  el.className = `product${p.featured ? ' featured' : ''}`;
  el.dataset.accent = p.accent || 'roleplay';

  const badge = p.featured ? '<span class="badge">Meest gekozen</span>' : '';
  const interval = p.interval ? `<span class="product-interval"> ${p.interval}</span>` : '';
  const perks = (p.perks || []).map((perk) => `<li>${perk}</li>`).join('');

  el.innerHTML = `
    ${badge}
    <div class="product-top">
      <h4>${p.name}</h4>
      <div class="product-price">${euro(p.price)}${interval}</div>
    </div>
    <p>${p.description}</p>
    <ul class="perks">${perks}</ul>
    <button class="btn ${p.featured ? 'btn-primary' : 'btn-ghost'}" data-product="${p.id}" ${actief ? '' : 'disabled'}>
      ${actief ? 'Afrekenen' : 'Binnenkort beschikbaar'}
    </button>`;

  return el;
}

async function laadWinkel() {
  const doel = document.getElementById('shopContent');

  try {
    const data = await getJSON('/api/shop');
    doel.className = 'shop-cats';
    doel.textContent = '';

    const categorieen = [...new Set(data.products.map((p) => p.category))];

    for (const categorie of categorieen) {
      const kop = document.createElement('h3');
      kop.className = 'shop-cat-head';
      kop.textContent = categorie;

      const grid = document.createElement('div');
      grid.className = 'shop-grid';
      for (const p of data.products.filter((p) => p.category === categorie)) {
        grid.append(productKaart(p, data.enabled));
      }

      const blok = document.createElement('div');
      blok.append(kop, grid);
      doel.append(blok);
    }

    if (!data.enabled) {
      const melding = document.createElement('p');
      melding.className = 'shop-error';
      melding.textContent =
        'Betalingen staan nog uit. Zet STRIPE_SECRET_KEY in de omgevingsvariabelen om de winkel te openen.';
      doel.append(melding);
    }

    doel.addEventListener('click', afrekenen);
  } catch (err) {
    doel.className = 'empty-state';
    doel.innerHTML = '<h3>Winkel kon niet geladen worden</h3><p>Ververs de pagina of probeer het later opnieuw.</p>';
    console.error(err);
  }
}

async function afrekenen(event) {
  const knop = event.target.closest('[data-product]');
  if (!knop) return;

  const origineel = knop.textContent;
  knop.disabled = true;
  knop.textContent = 'Bezig…';

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: knop.dataset.product }),
    });
    const data = await res.json();

    if (!res.ok || !data.url) throw new Error(data.error || 'Afrekenen mislukt');
    window.location.href = data.url;
  } catch (err) {
    knop.disabled = false;
    knop.textContent = origineel;

    let melding = knop.parentElement.querySelector('.shop-error');
    if (!melding) {
      melding = document.createElement('p');
      melding.className = 'shop-error';
      knop.parentElement.append(melding);
    }
    melding.textContent = `Afrekenen lukte niet: ${err.message}. Probeer het opnieuw of open een ticket in Support.`;
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
laadWinkel();
laadCommunities();
setInterval(laadStatus, 45000);
