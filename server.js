import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';

import { config, hasDiscord, hasStripe } from './src/config.js';
import { api } from './src/routes.js';
import { stripe, handleStripeEvent } from './src/payments.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

/**
 * De Stripe-webhook moet de ruwe body hebben om de handtekening te controleren,
 * dus die staat bewust vóór express.json().
 */
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !config.stripe.webhookSecret) return res.status(503).end();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      config.stripe.webhookSecret
    );
  } catch (err) {
    console.error('[stripe] ongeldige handtekening:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  res.json({ received: true });
  handleStripeEvent(event).catch((err) => console.error('[stripe]', err.message));
});

app.use(compression());
app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use('/api', api);

app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '7d',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  })
);

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(config.port, () => {
  console.log(`Alkmaar Roleplay draait op poort ${config.port}`);
  console.log(`  Discord-koppeling : ${hasDiscord ? 'aan' : 'uit (zet DISCORD_BOT_TOKEN en DISCORD_GUILD_ID)'}`);
  console.log(`  Staffrollen       : ${config.discord.staffRoles.length}`);
  console.log(`  Betalingen        : ${hasStripe ? 'aan' : 'uit (zet STRIPE_SECRET_KEY)'}`);
  console.log(`  FiveM join-code   : ${config.fivem.joinCode}`);
});
