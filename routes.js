import express from 'express';
import { config, hasDiscord, hasTebex } from './config.js';
import { getStaff, getCommunities, getGuildCounts, getBotInfo } from './discord.js';
import { getServerStatus, testAlleBronnen } from './fivem.js';
import { createTebexCheckout, continueTebexCheckout, getTebexProduct, tebexFallbackProduct } from './tebex.js';

export const api = express.Router();


/** Productgegevens voor de eigen webshop. De prijzen worden waar mogelijk live uit Tebex gehaald. */
api.get('/shop/product', async (req, res) => {
  try {
    const result = await getTebexProduct();
    res.set('Cache-Control', 'public, max-age=30');
    res.json({ ...result, note: null });
  } catch (err) {
    console.warn(`[Tebex] Productgegevens konden niet worden opgehaald: ${err.message}`);
    // Toon de productkaart nog steeds; Tebex zelf bevestigt de definitieve checkout-prijs.
    res.set('Cache-Control', 'no-store');
    res.json({
      product: tebexFallbackProduct,
      configured: true,
      checkoutEnabled: true,
      note: 'De live productgegevens konden niet worden opgehaald. De definitieve prijs wordt in de Tebex-checkout bevestigd.',
    });
  }
});

/** Maak de Tebex-basket aan en begin met Cfx/FiveM-accountautorisatie. */
api.post('/shop/checkout', async (req, res) => {
  try {
    const redirectUrl = await createTebexCheckout(req);
    res.set('Cache-Control', 'no-store');
    res.json({ redirectUrl });
  } catch (err) {
    const status = Number.isInteger(err.status) ? err.status : 502;
    console.error(`[Tebex] Checkout voorbereiden mislukt: ${err.message}`);
    res.status(status).json({ error: err.message || 'De Tebex-checkout kon niet worden gestart.' });
  }
});

/** Callback na autorisatie; haalt de basket-checkoutlink opnieuw op bij Tebex. */
api.get('/shop/continue', async (req, res) => {
  try {
    const checkoutUrl = await continueTebexCheckout(String(req.query.basket || ''));
    res.set('Cache-Control', 'no-store');
    res.redirect(303, checkoutUrl);
  } catch (err) {
    const status = Number.isInteger(err.status) ? err.status : 502;
    console.error(`[Tebex] Doorgaan naar checkout mislukt: ${err.message}`);
    res.status(status).type('html').send(`<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Checkout niet beschikbaar</title><body style="font-family:system-ui;background:#060a12;color:#eaf0fd;max-width:680px;margin:12vh auto;padding:24px;line-height:1.6"><h1>Checkout niet beschikbaar</h1><p>${escapeHtml(err.message || 'De checkout kon niet worden geopend.')}</p><p><a style="color:#7fb6e8" href="/#winkel">Terug naar de webshop</a></p></body></html>`);
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
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
    tebex: hasTebex,
    staffRoles: config.discord.staffRoles.length,
    joinCode: config.fivem.joinCode,
  });
});
