import { config } from './config.js';
import { cached } from './cache.js';

/**
 * Cfx heeft zijn server-API verhuisd. Het oude adres werkt op sommige plekken nog,
 * op andere geeft het 404 of een Cloudflare-blokkade. Daarom proberen we ze allebei,
 * in deze volgorde, en gebruiken we het eerste antwoord dat klopt.
 */
const CFX_HOSTS = [
  'https://frontend.cfx-services.net/api/servers/single/',
  'https://servers-frontend.fivem.net/api/servers/single/',
];

// Cloudflare weigert kale scripts. Met deze headers zien we eruit als een browser.
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
  Referer: 'https://servers.fivem.net/',
};

/** FiveM-hostnames bevatten kleurcodes zoals ^1 en ~r~. Die halen we eruit. */
function stripColors(text) {
  return String(text || '')
    .replace(/\^\d/g, '')
    .replace(/~[a-z]~/gi, '')
    .trim();
}

function leeg() {
  return {
    online: false,
    hostname: 'Alkmaar Roleplay',
    clients: 0,
    maxClients: 64,
    queue: 0,
    joinCode: config.fivem.joinCode,
    source: 'geen',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Bron 1 - rechtstreeks bij de server.
 * Elke FiveM-server publiceert /info.json en /players.json op zijn eigen poort.
 * Werkt alleen als poort 30120 ook voor TCP-verkeer open staat, niet enkel voor het spel.
 */
async function viaServer(host) {
  const base = host.startsWith('http') ? host : `http://${host}`;

  const [info, players] = await Promise.all([
    fetch(`${base}/info.json`, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(4000) }),
    fetch(`${base}/players.json`, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(4000) }),
  ]);

  if (!info.ok || !players.ok) throw new Error(`server gaf ${info.status}/${players.status}`);

  const infoData = await info.json();
  const playerData = await players.json();
  const vars = infoData.vars || {};

  return {
    online: true,
    hostname: stripColors(vars.sv_projectName || vars.sv_hostname || 'Alkmaar Roleplay'),
    projectName: stripColors(vars.sv_projectName || ''),
    clients: Array.isArray(playerData) ? playerData.length : 0,
    maxClients: Number(vars.sv_maxClients || vars.sv_maxclients || 64),
    queue: Number(vars['Queue Count'] ?? vars.queue ?? 0) || 0,
    joinCode: config.fivem.joinCode,
    source: 'server',
    updatedAt: new Date().toISOString(),
  };
}

/** Bron 2 - de publieke Cfx.re-serverlijst, via een van de bekende adressen. */
async function viaCfx(code, endpoint) {
  const res = await fetch(`${endpoint}${code}`, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`status ${res.status}`);

  const d = (await res.json())?.Data;
  if (!d) throw new Error('onverwacht antwoord');

  const players = Array.isArray(d.players) ? d.players : [];

  return {
    online: true,
    hostname: stripColors(d.hostname || 'Alkmaar Roleplay'),
    projectName: stripColors(d.vars?.sv_projectName || ''),
    clients: d.clients ?? players.length,
    maxClients: d.svMaxclients ?? d.sv_maxclients ?? 64,
    queue: Number(d.vars?.['Queue Count'] ?? d.vars?.queue ?? 0) || 0,
    mapname: d.mapname || null,
    joinCode: config.fivem.joinCode,
    source: new URL(endpoint).hostname,
    updatedAt: new Date().toISOString(),
  };
}

// Reageert je server niet op poort 30120, dan heeft het geen zin om het elke
// halve minuut opnieuw te proberen: dat vertraagt alleen de hele pagina.
// Na drie mislukte pogingen slaan we de directe route vijf minuten over.
let directeFouten = 0;
let directeFoutTijd = 0;
const AFKOELING = 5 * 60 * 1000;

/** Probeert alle bronnen op volgorde. Lukt geen enkele, dan tonen we netjes "offline". */
export async function getServerStatus() {
  return cached('fivem-status', 30 * 1000, async () => {
    const host = config.fivem.host;
    const afkoelen = directeFouten >= 3 && Date.now() - directeFoutTijd < AFKOELING;

    if (host && !afkoelen) {
      try {
        const status = await viaServer(host);
        directeFouten = 0;
        return status;
      } catch (err) {
        directeFouten += 1;
        directeFoutTijd = Date.now();
        if (directeFouten === 3) {
          console.error(
            `[fivem] ${host} reageert niet op webverkeer. Poort 30120 staat waarschijnlijk alleen` +
              ' open voor het spel zelf en niet voor TCP. Ik gebruik voortaan Cfx.re.'
          );
        }
      }
    }

    for (const endpoint of CFX_HOSTS) {
      try {
        return await viaCfx(config.fivem.joinCode, endpoint);
      } catch (err) {
        console.error(`[fivem] ${new URL(endpoint).hostname} gaf ${err.message}`);
      }
    }

    throw new Error('geen enkele bron reageerde');
  }).catch(() => leeg());
}

/** Diagnose: probeert elke bron los en vertelt per stuk wat eruit kwam. */
export async function testAlleBronnen() {
  const resultaten = [];

  if (config.fivem.host) {
    try {
      const r = await viaServer(config.fivem.host);
      resultaten.push({ bron: `jouw server (${config.fivem.host})`, gelukt: true, spelers: r.clients });
    } catch (err) {
      resultaten.push({ bron: `jouw server (${config.fivem.host})`, gelukt: false, fout: err.message });
    }
  } else {
    resultaten.push({ bron: 'jouw server', gelukt: false, fout: 'FIVEM_SERVER_HOST is niet ingevuld' });
  }

  for (const endpoint of CFX_HOSTS) {
    const naam = new URL(endpoint).hostname;
    try {
      const r = await viaCfx(config.fivem.joinCode, endpoint);
      resultaten.push({ bron: naam, gelukt: true, naamServer: r.hostname, spelers: `${r.clients}/${r.maxClients}` });
    } catch (err) {
      resultaten.push({ bron: naam, gelukt: false, fout: err.message });
    }
  }

  return resultaten;
}
