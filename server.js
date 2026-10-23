import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';

import { config, hasDiscord } from './config.js';
import { api } from './routes.js';

const MAP = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(compression());
app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use('/api', api);

/**
 * Alles staat in een map, ook de server-code. Daarom serveren we niet zomaar
 * de hele map, maar alleen de bestanden die hieronder staan. Zo kan niemand
 * bijvoorbeeld /config.js of /package.json opvragen.
 *
 * Voeg je een afbeelding of pagina toe? Zet de bestandsnaam er dan bij.
 */
const PUBLIEKE_BESTANDEN = new Set([
  'index.html',
  'bedankt.html',
  '404.html',
  'style.css',
  'app.js',
  'banner.jpg',
  'favicon.png',
  'alkmaar-roleplay.png',
  'alkmaar-overheid.png',
  'alkmaar-support.png',
  'alkmaar-onderwereld.png',
  'alkmaar-roleplay-anim.webp',
  'alkmaar-overheid-anim.webp',
  'alkmaar-support-anim.webp',
  'alkmaar-onderwereld-anim.webp',
]);

const MIMETYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

app.get('*', (req, res) => {
  let naam;
  try {
    naam = req.path === '/' ? 'index.html' : path.basename(decodeURIComponent(req.path));
  } catch {
    naam = '';
  }

  const gevonden = PUBLIEKE_BESTANDEN.has(naam);
  const bestand = path.join(MAP, gevonden ? naam : '404.html');

  if (!fs.existsSync(bestand)) return res.status(404).send('Niet gevonden');

  const extensie = path.extname(bestand).toLowerCase();
  res.type(MIMETYPES[extensie] || 'application/octet-stream');
  res.set(
    'Cache-Control',
    extensie === '.html' ? 'no-cache' : 'public, max-age=604800'
  );
  res.status(gevonden ? 200 : 404).sendFile(bestand);
});

app.listen(config.port, () => {
  console.log(`Alkmaar Roleplay draait op poort ${config.port}`);
  console.log(`  Discord-koppeling : ${hasDiscord ? 'aan' : 'uit (zet DISCORD_BOT_TOKEN en DISCORD_GUILD_ID)'}`);
  console.log(`  Staffrollen       : ${config.discord.staffRoles.length}`);
  console.log(`  FiveM join-code   : ${config.fivem.joinCode}`);
});
