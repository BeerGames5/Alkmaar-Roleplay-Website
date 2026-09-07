import Stripe from 'stripe';
import { config, hasStripe } from './config.js';
import { findProduct } from './shop.js';
import { sendOrderWebhook } from './discord.js';

export const stripe = hasStripe ? new Stripe(config.stripe.secretKey) : null;

function baseUrl(req) {
  if (config.siteUrl) return config.siteUrl;
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  return `${proto}://${req.get('host')}`;
}

export async function createCheckout(req, productId) {
  const product = findProduct(productId);
  if (!product) throw Object.assign(new Error('Onbekend product'), { status: 400 });
  if (!stripe) throw Object.assign(new Error('Betalingen staan uit'), { status: 503 });

  const site = baseUrl(req);

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: config.stripe.paymentMethods,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: product.price,
          product_data: {
            name: `${product.name} — Alkmaar Roleplay`,
            description: product.description,
          },
        },
      },
    ],
    // Zo weet je wie de bestelling in het spel moet krijgen.
    custom_fields: [
      {
        key: 'discord',
        label: { type: 'custom', custom: 'Je Discord-naam' },
        type: 'text',
        text: { minimum_length: 2, maximum_length: 40 },
      },
      {
        key: 'karakter',
        label: { type: 'custom', custom: 'Naam van je karakter in het spel' },
        type: 'text',
        optional: true,
        text: { maximum_length: 60 },
      },
    ],
    metadata: {
      product_id: product.id,
      product_name: product.name,
    },
    success_url: `${site}/bedankt.html?sessie={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#winkel`,
    locale: 'nl',
  });
}

/** Verwerkt de webhook van Stripe en meldt de bestelling in Discord. */
export async function handleStripeEvent(event) {
  if (event.type !== 'checkout.session.completed') return;

  const session = event.data.object;
  const fields = Object.fromEntries(
    (session.custom_fields || []).map((f) => [f.key, f.text?.value || '—'])
  );

  await sendOrderWebhook({
    title: 'Nieuwe bestelling',
    color: 0x3f8ed6,
    fields: [
      { name: 'Pakket', value: session.metadata?.product_name || 'Onbekend', inline: true },
      {
        name: 'Bedrag',
        value: `€ ${((session.amount_total || 0) / 100).toFixed(2).replace('.', ',')}`,
        inline: true,
      },
      { name: 'Discord', value: fields.discord || '—', inline: true },
      { name: 'Karakter', value: fields.karakter || '—', inline: true },
      { name: 'E-mail', value: session.customer_details?.email || '—', inline: true },
      { name: 'Referentie', value: session.id, inline: false },
    ],
    timestamp: new Date().toISOString(),
  });
}
