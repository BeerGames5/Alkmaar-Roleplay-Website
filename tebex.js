import { config, hasTebex } from './config.js';

const API_BASE = 'https://headless.tebex.io/api';
const FALLBACK_PRODUCT = Object.freeze({
  id: 7761862,
  ident: 'pkg_3482158_7761862',
  name: 'Alkmaar Admin Panel V2',
  description: 'Een adminpaneel om beheerders op je FiveM-server te ondersteunen.',
  image: 'https://dunb17ur4ymx4.cloudfront.net/packages/images/7aaa309181d512f79f1531f2eec012f742bfe05c.png',
  base_price: 65,
  sales_tax: 13.65,
  total_price: 78.65,
  currency: 'EUR',
  category: { id: 3482158, name: 'Packages' },
  type: 'single',
});

let productCache = null;
let productCacheExpiresAt = 0;
const PRODUCT_CACHE_MS = 60_000;

function unwrap(payload) {
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : payload;
}

function errorWithStatus(message, status = 502) {
  return Object.assign(new Error(message), { status });
}

async function tebexFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw errorWithStatus('Tebex is tijdelijk niet bereikbaar. Probeer het straks opnieuw.', 502);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof payload?.detail === 'string' ? payload.detail : '';
    const safeDetail = detail.length > 180 ? `${detail.slice(0, 180)}…` : detail;
    throw errorWithStatus(
      safeDetail || `Tebex heeft de aanvraag geweigerd (HTTP ${response.status}).`,
      response.status >= 400 && response.status < 500 ? 400 : 502,
    );
  }
  return payload;
}

function accountUrl(path = '') {
  const token = encodeURIComponent(config.tebex.publicToken);
  return `${API_BASE}/accounts/${token}${path}`;
}

function cleanProduct(packageData) {
  const imageCandidate = typeof packageData?.image === 'string' ? packageData.image : '';
  let image = FALLBACK_PRODUCT.image;
  try {
    const parsed = new URL(imageCandidate);
    if (parsed.protocol === 'https:') image = parsed.href;
  } catch {
    // Gebruik de bekende package-afbeelding als Tebex geen geldige afbeelding terugstuurt.
  }

  const price = Number(packageData?.total_price);
  const basePrice = Number(packageData?.base_price);
  const tax = Number(packageData?.sales_tax);
  const currency = /^[A-Z]{3}$/.test(String(packageData?.currency || ''))
    ? String(packageData.currency)
    : FALLBACK_PRODUCT.currency;

  return {
    id: Number(packageData?.id) || FALLBACK_PRODUCT.id,
    ident: config.tebex.packageIdent,
    name: String(packageData?.name || FALLBACK_PRODUCT.name).slice(0, 120),
    description: String(packageData?.description || FALLBACK_PRODUCT.description)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000),
    image,
    basePrice: Number.isFinite(basePrice) && basePrice >= 0 ? basePrice : FALLBACK_PRODUCT.base_price,
    salesTax: Number.isFinite(tax) && tax >= 0 ? tax : FALLBACK_PRODUCT.sales_tax,
    totalPrice: Number.isFinite(price) && price >= 0 ? price : FALLBACK_PRODUCT.total_price,
    currency,
    category: String(packageData?.category?.name || FALLBACK_PRODUCT.category.name).slice(0, 80),
  };
}

export async function getTebexProduct({ forceRefresh = false } = {}) {
  if (!hasTebex) {
    return { product: cleanProduct(FALLBACK_PRODUCT), checkoutEnabled: false, configured: false };
  }

  if (!forceRefresh && productCache && Date.now() < productCacheExpiresAt) {
    return { product: productCache, checkoutEnabled: true, configured: true };
  }

  const response = await tebexFetch(accountUrl('/packages'));
  const packages = unwrap(response);
  const list = Array.isArray(packages) ? packages : [];
  const found = list.find((item) => String(item?.ident || '') === config.tebex.packageIdent);

  if (!found) {
    throw errorWithStatus(
      'Het ingestelde Tebex-product is niet gevonden. Controleer TEBEX_PACKAGE_IDENT in Render.',
      503,
    );
  }

  productCache = cleanProduct(found);
  productCacheExpiresAt = Date.now() + PRODUCT_CACHE_MS;
  return { product: productCache, checkoutEnabled: true, configured: true };
}

function validateTebexUrl(value, hostname, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw errorWithStatus(`Tebex gaf geen geldige ${label}-link terug.`, 502);
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== hostname) {
    throw errorWithStatus(`Tebex gaf geen vertrouwde ${label}-link terug.`, 502);
  }
  return parsed.href;
}

function siteBaseUrl(req) {
  if (config.siteUrl) return config.siteUrl;
  const forwardedProto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
  const protocol = forwardedProto === 'https' ? 'https' : 'http';
  return `${protocol}://${req.get('host')}`;
}

export async function createTebexCheckout(req) {
  if (!hasTebex) {
    throw errorWithStatus('De Tebex-koppeling is nog niet ingesteld. Vul TEBEX_PUBLIC_TOKEN in bij Render.', 503);
  }

  // Haal actuele packagegegevens op en controleer dat dit product nog bestaat.
  const { product } = await getTebexProduct({ forceRefresh: true });
  const site = siteBaseUrl(req);

  const createdPayload = await tebexFetch(accountUrl('/baskets'), {
    method: 'POST',
    body: JSON.stringify({
      complete_url: `${site}/bedankt.html?betaling=afgerond`,
      cancel_url: `${site}/#winkel`,
      complete_auto_redirect: true,
      custom: {
        source: 'alkmaar-roleplay-website',
        product_ident: config.tebex.packageIdent,
        product_name: product.name,
      },
    }),
  });

  const basket = unwrap(createdPayload);
  const basketIdent = String(basket?.ident || '');
  if (!/^[a-zA-Z0-9_-]{8,160}$/.test(basketIdent)) {
    throw errorWithStatus('Tebex heeft geen geldig winkelmandje teruggegeven.', 502);
  }

  // Het product wordt geselecteerd op de server; de browser kan geen prijs/product-ID wijzigen.
  await tebexFetch(`${API_BASE}/baskets/${encodeURIComponent(basketIdent)}/packages`, {
    method: 'POST',
    body: JSON.stringify({ package_id: config.tebex.packageId, quantity: 1 }),
  });

  // Cfx/FiveM-account autoriseren vóór de checkout, nodig voor levering van FiveM Assets.
  const callback = `${site}/api/shop/continue?basket=${encodeURIComponent(basketIdent)}`;
  const authPayload = await tebexFetch(
    accountUrl(`/baskets/${encodeURIComponent(basketIdent)}/auth?returnUrl=${encodeURIComponent(callback)}`),
  );
  const authOptions = Array.isArray(authPayload)
    ? authPayload
    : Array.isArray(authPayload?.data)
      ? authPayload.data
      : [];
  const fiveMAuth = authOptions.find((option) => /fivem/i.test(String(option?.name || '')));

  if (!fiveMAuth?.url) {
    throw errorWithStatus(
      'Tebex gaf geen FiveM-accountkoppeling terug. Controleer of het package als FiveM Asset is ingesteld in Tebex.',
      502,
    );
  }

  return validateTebexUrl(fiveMAuth.url, 'ident.tebex.io', 'Cfx.re-accountautorisatie');
}

export async function continueTebexCheckout(basketIdent) {
  if (!hasTebex) {
    throw errorWithStatus('De Tebex-koppeling is nog niet ingesteld.', 503);
  }
  if (typeof basketIdent !== 'string' || !/^[a-zA-Z0-9_-]{8,160}$/.test(basketIdent)) {
    throw errorWithStatus('Dit winkelmandje is ongeldig of verlopen.', 400);
  }

  const response = await tebexFetch(accountUrl(`/baskets/${encodeURIComponent(basketIdent)}`));
  const basket = unwrap(response);
  if (!basket?.links?.checkout) {
    throw errorWithStatus('De Tebex-checkout kon niet worden geopend. Begin opnieuw vanaf de webshop.', 502);
  }
  return validateTebexUrl(basket.links.checkout, 'checkout.tebex.io', 'checkout');
}

export const tebexFallbackProduct = cleanProduct(FALLBACK_PRODUCT);
