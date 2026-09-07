import { config } from './config.js';
import { cached } from './cache.js';

const CFX_ENDPOINT = 'https://servers-frontend.fivem.net/api/servers/single/';
const UA = 'Mozilla/5.0 (compatible; AlkmaarRP-Website/1.0)';

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
 * Dit is de betrouwbaarste manier, maar je moet het adres wel weten.
 */
async function viaServer(host) {
  const base = host.startsWith('http') ? host : `http://${host}`;

  const [info, players] = await Promise.all([
    fetch(`${base}/info.json`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4000) }),
    fetch(`${base}/players.json`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4000) }),
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

/**
 * Bron 2 - de publieke Cfx.re-serverlijst.
 * Werkt zonder dat je het IP-adres prijsgeeft, maar Cfx.re knijpt het verkeer soms af.
 */
async function viaCfx(code) {
  const res = await fetch(`${CFX_ENDPOINT}${code}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Cfx.re gaf status ${res.status}`);

  const d = (await res.json())?.Data;
  if (!d) throw new Error('Onverwacht antwoord van Cfx.re');

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
    source: 'cfx',
    updatedAt: new Date().toISOString(),
  };
}

// Reageert je server niet op poort 30120, dan heeft het geen zin om het elke
// halve minuut opnieuw te proberen: dat vertraagt alleen de hele pagina.
// Na drie mislukte pogingen slaan we de directe route vijf minuten over.
let directeFouten = 0;
let directeFoutTijd = 0;
const AFKOELING = 5 * 60 * 1000;

/**
 * Probeert eerst je eigen server (als FIVEM_SERVER_HOST is ingevuld) en valt terug op Cfx.re.
 * Lukt geen van beide, dan tonen we netjes "offline" in plaats van een fout.
 */
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
            `[fivem] ${host} reageert niet op webverkeer. Poort 30120 staat waarschijnlijk` +
              ' alleen open voor het spel zelf. Ik gebruik voortaan Cfx.re; haal FIVEM_SERVER_HOST' +
              ' weg om deze melding te stoppen.'
          );
        } else {
          console.error(`[fivem] directe query mislukt (${err.message}), probeer Cfx.re`);
        }
      }
    }

    return viaCfx(config.fivem.joinCode);
  }).catch(() => leeg());
}
