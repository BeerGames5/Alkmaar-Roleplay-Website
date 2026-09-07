import express from 'express';
import { config, hasDiscord, hasStripe } from './config.js';
import { getStaff, getCommunities, getGuildCounts, getBotInfo } from './discord.js';
import { getServerStatus, testAlleBronnen } from './fivem.js';
import { products } from './shop.js';
import { createCheckout } from './payments.js';

export const api = express.Router();

// Eenvoudige rem op de checkout: 10 pogingen per IP per 10 minuten.
const attempts = new Map();
function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  const now = Date.now();
  const window = 10 * 60 * 1000;
  const list = (attempts.get(ip) || []).filter((t) => now - t < window);
  if (list.length >= 10) {
    return res.status(429).json({ error: 'Te veel pogingen. Probeer het over tien minuten opnieuw.' });
  }
  list.push(now);
  attempts.set(ip, list);
  next();
}

api.get('/status', async (req, res) => {
  const [server, discord] = await Promise.all([
    getServerStatus(),
    getGuildCounts().catch(() => null),
  ]);
  res.set('Cache-Control', 'public, max-age=20');
  res.json({ server, discord });
});

api.get('/staff', async (req, res) => {
  try {
    const staff = await getStaff();
    res.set('Cache-Control', 'public, max-age=120');
    res.json(staff);
  } catch (err) {
    res.status(200).json({ configured: false, groups: [], error: err.message });
  }
});

api.get('/communities', async (req, res) => {
  const communities = await getCommunities();
  res.set('Cache-Control', 'public, max-age=300');
  res.json(communities);
});

api.get('/shop', (req, res) => {
  res.json({
    enabled: hasStripe,
    currency: 'EUR',
    products: products.map(({ id, name, category, price, interval, description, perks, accent, featured }) => ({
      id, name, category, price, interval, description, perks, accent, featured,
    })),
  });
});

api.post('/checkout', rateLimit, async (req, res) => {
  try {
    const session = await createCheckout(req, req.body?.productId);
    res.json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

/**
 * Diagnose voor de Discord-koppeling. Open /api/diagnose in je browser als het
 * team leeg blijft: je ziet dan welke bot je token is en in welke servers hij zit.
 */
api.get('/diagnose', async (req, res) => {
  if (!hasDiscord) {
    return res.json({
      probleem: 'DISCORD_BOT_TOKEN of DISCORD_GUILD_ID is niet ingevuld.',
    });
  }

  try {
    const info = await getBotInfo();
    const ingesteld = config.discord.guildId;
    const klopt = info.guilds.some((g) => g.id === ingesteld);

    res.json({
      tokenHoortBijBot: info.bot,
      ingesteldGuildId: ingesteld,
      botZitInDieServer: klopt,
      advies: klopt
        ? 'Alles klopt. Blijft het team leeg, zet dan Server Members Intent aan in het Developer Portal.'
        : 'Deze bot zit NIET in die server. Neem het juiste ID over uit de lijst hieronder, of nodig deze bot alsnog uit in je hoofdserver.',
      serversWaarDezeBotInZit: info.guilds,
    });
  } catch (err) {
    res.status(500).json({
      probleem: err.message,
      advies: err.message.includes('401')
        ? 'Het token wordt niet geaccepteerd. Reset het in het Developer Portal en neem het opnieuw over.'
        : 'Controleer je token en internetverbinding.',
    });
  }
});

/** Diagnose voor de serverstatus: welke bron werkt wel en welke niet? */
api.get('/diagnose-server', async (req, res) => {
  const bronnen = await testAlleBronnen();
  const werkend = bronnen.filter((b) => b.gelukt);

  res.json({
    joinCode: config.fivem.joinCode,
    werkendeBronnen: werkend.length,
    advies: werkend.length
      ? `Gebruikt wordt: ${werkend[0].bron}.`
      : 'Geen enkele bron reageert. Staat je server aan en is hij zichtbaar op cfx.re/join/' +
        config.fivem.joinCode + '?',
    bronnen,
  });
});

api.get('/health', (req, res) => {
  res.json({
    ok: true,
    discord: hasDiscord,
    stripe: hasStripe,
    staffRoles: config.discord.staffRoles.length,
    joinCode: config.fivem.joinCode,
  });
});
