import express from 'express';
import { config, hasDiscord, hasStripe } from './config.js';
import { getStaff, getCommunities, getGuildCounts } from './discord.js';
import { getServerStatus } from './fivem.js';
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

api.get('/health', (req, res) => {
  res.json({
    ok: true,
    discord: hasDiscord,
    stripe: hasStripe,
    staffRoles: config.discord.staffRoles.length,
    joinCode: config.fivem.joinCode,
  });
});
